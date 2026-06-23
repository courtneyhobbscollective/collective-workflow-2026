/**
 * Import monday.com contacts export (.xlsx) into Workflow clients + contacts.
 *
 * Usage:
 *   npx tsx scripts/import-monday-contacts.ts /path/to/Contacts.xlsx           # dry run
 *   npx tsx scripts/import-monday-contacts.ts /path/to/Contacts.xlsx --apply   # write to DATABASE_URL
 */

import * as XLSX from "xlsx";
import { ClientContactRole, PrismaClient } from "@prisma/client";
import { loadDatabaseUrlFromEnvFiles } from "../src/lib/load-database-url";
import { ensureClientChannelWithMembers } from "../src/lib/team-chat";

loadDatabaseUrlFromEnvFiles();

type ParsedRow = {
  firstName: string;
  lastName: string;
  fullName: string;
  company: string | null;
  email: string | null;
  title: string | null;
  phone: string | null;
  itemId: string;
};

type ContactPayload = {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  title: string | null;
  phone: string | null;
  role: ClientContactRole;
  isPrimary: boolean;
};

const ROLES: ClientContactRole[] = ["point_of_contact", "accounts_contact", "other"];

function norm(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

function normKey(s: string) {
  return norm(s).toLowerCase();
}

function splitPersonName(full: string) {
  const cleaned = norm(full);
  if (!cleaned) return { firstName: "Unknown", lastName: "", fullName: "Unknown" };
  const parts = cleaned.split(" ");
  const firstName = parts[0] ?? cleaned;
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName, fullName: cleaned };
}

function placeholderEmail(itemId: string, fullName: string) {
  const slug = normKey(fullName).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "contact";
  const id = itemId.replace(/[^a-zA-Z0-9]/g, "") || "row";
  return `import.${slug}.${id}@contacts.collectflow.local`;
}

function parseWorkbook(filePath: string): ParsedRow[] {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { defval: "", header: 1 });

  let headerIndex = -1;
  let headers: string[] = [];
  for (let i = 0; i < matrix.length; i++) {
    const row = matrix[i] ?? [];
    const normalized = row.map((cell) => norm(String(cell ?? "")));
    const nameIdx = normalized.findIndex((c) => c === "Name");
    const emailIdx = normalized.findIndex((c) => c === "Email");
    if (nameIdx >= 0 && emailIdx >= 0) {
      headerIndex = i;
      headers = normalized;
      break;
    }
  }

  if (headerIndex < 0) {
    throw new Error("Could not find header row with Name and Email columns.");
  }

  const col = (name: string) => headers.findIndex((h) => h === name);

  const nameCol = col("Name");
  const accountsCol = col("Accounts");
  const emailCol = col("Email");
  const titleCol = col("Title");
  const phoneCol = col("Phone");
  const itemIdCol = col("Item ID (auto generated)");

  const rows: ParsedRow[] = [];

  for (const row of matrix.slice(headerIndex + 1)) {
    const cells = row ?? [];
    const name = norm(String(cells[nameCol] ?? ""));
    if (!name) continue;

    const { firstName, lastName, fullName } = splitPersonName(name);
    const companyRaw = accountsCol >= 0 ? norm(String(cells[accountsCol] ?? "")) : "";
    const emailRaw = emailCol >= 0 ? norm(String(cells[emailCol] ?? "")) : "";
    const titleRaw = titleCol >= 0 ? norm(String(cells[titleCol] ?? "")) : "";
    const phoneRaw = phoneCol >= 0 ? norm(String(cells[phoneCol] ?? "")) : "";
    const itemId = itemIdCol >= 0 ? norm(String(cells[itemIdCol] ?? "")) : "";

    rows.push({
      firstName,
      lastName,
      fullName,
      company: companyRaw || null,
      email: emailRaw || null,
      title: titleRaw || null,
      phone: phoneRaw || null,
      itemId,
    });
  }

  return rows;
}

function contactScore(row: ParsedRow) {
  return (row.email ? 4 : 0) + (row.phone ? 2 : 0) + (row.title ? 1 : 0);
}

function toContactPayload(row: ParsedRow, role: ClientContactRole, isPrimary: boolean): ContactPayload {
  return {
    firstName: row.firstName,
    lastName: row.lastName,
    fullName: row.fullName,
    email: row.email ?? placeholderEmail(row.itemId, row.fullName),
    title: row.title,
    phone: row.phone,
    role,
    isPrimary,
  };
}

function buildImportPlan(rows: ParsedRow[]) {
  const groups = new Map<string, ParsedRow[]>();

  for (const row of rows) {
    const key = row.company ? normKey(row.company) : `person:${normKey(row.fullName)}`;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const planned: Array<{ clientName: string; contacts: ContactPayload[]; overflowNote?: string }> = [];

  for (const [, people] of groups) {
    const deduped = new Map<string, ParsedRow>();
    for (const person of people) {
      const key = person.email
        ? normKey(person.email)
        : `name:${normKey(person.fullName)}`;
      const existing = deduped.get(key);
      if (!existing || contactScore(person) > contactScore(existing)) {
        deduped.set(key, person);
      }
    }
    const sorted = [...deduped.values()].sort((a, b) => contactScore(b) - contactScore(a));
    const company = sorted[0]?.company ?? null;
    const baseName = company ?? sorted[0].fullName;

    const primaryBatch = sorted.slice(0, 3);
    const overflow = sorted.slice(3);

    const contacts = primaryBatch.map((person, index) =>
      toContactPayload(person, ROLES[index] ?? "other", index === 0)
    );

    let overflowNote: string | undefined;
    if (overflow.length) {
      overflowNote = overflow
        .map((p) => `${p.fullName}${p.email ? ` <${p.email}>` : ""}${p.phone ? ` · ${p.phone}` : ""}`)
        .join("\n");
    }

    planned.push({ clientName: baseName, contacts, overflowNote });

    for (const extra of overflow) {
      planned.push({
        clientName: company ? `${company} — ${extra.fullName}` : extra.fullName,
        contacts: [toContactPayload(extra, "point_of_contact", true)],
      });
    }
  }

  return planned;
}

async function main() {
  const filePath = process.argv[2];
  const apply = process.argv.includes("--apply");

  if (!filePath) {
    console.error("Usage: npx tsx scripts/import-monday-contacts.ts /path/to/Contacts.xlsx [--apply]");
    process.exit(1);
  }

  const rows = parseWorkbook(filePath);
  const plan = buildImportPlan(rows);

  console.log(`Parsed ${rows.length} contacts → ${plan.length} client records to create/update.`);
  console.log(apply ? "MODE: apply (writing to database)" : "MODE: dry run (pass --apply to import)");

  const prisma = new PrismaClient();
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let channels = 0;

  try {
    const existingClients = await prisma.client.findMany({
      select: { id: true, name: true, contacts: { select: { email: true } } },
    });
    const clientByName = new Map(existingClients.map((c) => [normKey(c.name), c]));

    for (const entry of plan) {
      const key = normKey(entry.clientName);
      const existing = clientByName.get(key);
      const poc = entry.contacts.find((c) => c.role === "point_of_contact") ?? entry.contacts[0];

      if (existing) {
        const existingEmails = new Set(existing.contacts.map((c) => normKey(c.email)));
        const newContacts = entry.contacts.filter((c) => !existingEmails.has(normKey(c.email)));

        if (!newContacts.length) {
          skipped++;
          console.log(`SKIP  ${entry.clientName} (already exists)`);
          continue;
        }

        if (!apply) {
          updated++;
          console.log(`WOULD UPDATE ${entry.clientName} (+${newContacts.length} contacts)`);
          continue;
        }

        for (const contact of newContacts) {
          const takenRoles = new Set(
            (
              await prisma.clientContact.findMany({
                where: { clientId: existing.id },
                select: { role: true },
              })
            ).map((c) => c.role)
          );
          let role = contact.role;
          if (takenRoles.has(role)) {
            role = ROLES.find((r) => !takenRoles.has(r)) ?? "other";
          }
          if (takenRoles.has(role)) {
            console.log(`SKIP contact ${contact.fullName} on ${entry.clientName} (roles full)`);
            continue;
          }

          await prisma.clientContact.create({
            data: {
              clientId: existing.id,
              firstName: contact.firstName,
              lastName: contact.lastName || null,
              name: contact.fullName,
              email: contact.email,
              phoneNumber: contact.phone,
              title: contact.title,
              isPrimary: contact.isPrimary,
              role,
            },
          });
        }

        if (entry.overflowNote) {
          const current = await prisma.client.findUnique({ where: { id: existing.id }, select: { brandSummary: true } });
          const note = `Additional contacts from monday.com import:\n${entry.overflowNote}`;
          if (!current?.brandSummary?.includes(entry.overflowNote)) {
            await prisma.client.update({
              where: { id: existing.id },
              data: {
                brandSummary: current?.brandSummary ? `${current.brandSummary}\n\n${note}` : note,
              },
            });
          }
        }

        updated++;
        console.log(`UPDATED ${entry.clientName}`);
        continue;
      }

      if (!apply) {
        created++;
        console.log(`WOULD CREATE ${entry.clientName} · ${entry.contacts.map((c) => c.fullName).join(", ")}`);
        continue;
      }

      const brandParts: string[] = [];
      if (entry.overflowNote) {
        brandParts.push(`Additional contacts from monday.com import:\n${entry.overflowNote}`);
      }
      brandParts.push("Imported from monday.com contacts export.");

      const client = await prisma.client.create({
        data: {
          name: entry.clientName,
          status: "active",
          engagementType: "project",
          email: poc?.email?.includes("@contacts.collectflow.local") ? null : poc?.email ?? null,
          phoneNumber: poc?.phone ?? null,
          brandSummary: brandParts.join("\n\n"),
          contacts: {
            create: entry.contacts.map((c) => ({
              firstName: c.firstName,
              lastName: c.lastName || null,
              name: c.fullName,
              email: c.email,
              phoneNumber: c.phone,
              title: c.title,
              isPrimary: c.isPrimary,
              role: c.role,
            })),
          },
        },
      });

      await ensureClientChannelWithMembers(client.id);
      clientByName.set(key, { id: client.id, name: client.name, contacts: entry.contacts.map((c) => ({ email: c.email })) });
      created++;
      channels++;
      console.log(`CREATED ${entry.clientName}`);
    }

    console.log("\n---");
    console.log({ created, updated, skipped, channels });
  } finally {
    await prisma.$disconnect();
  }
}

void main();
