import * as XLSX from "xlsx";
import { parseDealStageLabel } from "@/lib/deals/config";

export type ParsedDealRow = {
  boardLabel: string;
  year: number;
  month: number;
  name: string;
  account: string | null;
  contact: string | null;
  stage: ReturnType<typeof parseDealStageLabel>;
  billingStatus: string | null;
  dealValue: number | null;
  notes: string | null;
  mondayItemId: string | null;
  timelineStart: string | null;
  timelineEnd: string | null;
};

export type ParsedDealUpdate = {
  mondayItemId: string;
  itemName: string;
  authorName: string;
  body: string;
  createdAt: Date;
  mondayPostId: string | null;
};

const MONTH_NAMES =
  "January|February|March|April|May|June|July|August|September|October|November|December|Decemeber";

const MONTH_HEADER_RE = new RegExp(`^(${MONTH_NAMES})\\s+(\\d{4})$`, "i");
const STOP_SECTION_RE = /^(lost\/dead|name)$/i;

function parseMonthHeader(first: string): { label: string; year: number; month: number } | null {
  const normalized = first.trim().replace(/^Decemeber/i, "December");
  const m = normalized.match(new RegExp(`^(${MONTH_NAMES.replace("Decemeber|", "")})\\s+(\\d{4})$`, "i"));
  if (!m) return null;
  const monthName = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  const year = Number(m[2]);
  const month = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
  return { label: `${monthName} ${year}`, year, month };
}

function parseMoney(raw: unknown): number | null {
  if (raw === "" || raw == null) return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[£,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseExcelDate(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  return s;
}

export function parseYtdDealsFromWorkbook(filePath: string, years = [2025, 2026]): ParsedDealRow[] {
  const wb = XLSX.readFile(filePath);
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["ytd"], { header: 1, defval: "" });

  const deals: ParsedDealRow[] = [];
  let currentBoard: { label: string; year: number; month: number } | null = null;
  let cols: string[] | null = null;

  const col = (row: unknown[], name: string) => {
    if (!cols) return "";
    const idx = cols.findIndex((c) => String(c).trim() === name);
    return idx >= 0 ? String(row[idx] ?? "").trim() : "";
  };

  for (const row of matrix) {
    const cells = row ?? [];
    const first = String(cells[0] ?? "").trim();

    const monthHeader = parseMonthHeader(first);
    if (monthHeader) {
      if (years.includes(monthHeader.year)) {
        currentBoard = monthHeader;
        cols = null;
      } else {
        currentBoard = null;
        cols = null;
      }
      continue;
    }

    if (!currentBoard) continue;

    if (first === "Name" && cells.some((c) => String(c).trim() === "Stage")) {
      cols = cells.map((c) => String(c ?? "").trim());
      continue;
    }

    if (!cols || !first || STOP_SECTION_RE.test(first)) {
      if (STOP_SECTION_RE.test(first)) cols = null;
      continue;
    }

    const stageRaw = col(cells, "Stage");
    const value = parseMoney(cells[cols.indexOf("Deal Value")]);
    const account = col(cells, "Accounts") || null;
    if (!stageRaw && value == null && !account) continue;

    deals.push({
      boardLabel: currentBoard.label,
      year: currentBoard.year,
      month: currentBoard.month,
      name: first,
      account,
      contact: col(cells, "Contacts") || null,
      stage: parseDealStageLabel(stageRaw || "Lead"),
      billingStatus: col(cells, "Status") || null,
      dealValue: value,
      notes: col(cells, "Notes") || null,
      mondayItemId: col(cells, "Item ID (auto generated)") || null,
      timelineStart: parseExcelDate(cells[cols.indexOf("Timeline - Start")]),
      timelineEnd: parseExcelDate(cells[cols.indexOf("Timeline - End")]),
    });
  }

  return deals;
}

export function parseYtdUpdatesFromWorkbook(filePath: string): ParsedDealUpdate[] {
  const wb = XLSX.readFile(filePath);
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["updates"], { header: 1, defval: "" });

  const updates: ParsedDealUpdate[] = [];
  for (const row of matrix.slice(2)) {
    const itemId = String(row?.[0] ?? "").trim();
    const itemName = String(row?.[1] ?? "").trim();
    const authorName = String(row?.[4] ?? "").trim() || "Team";
    const createdRaw = String(row?.[5] ?? "").trim();
    const body = String(row?.[6] ?? "").trim();
    const postId = String(row?.[9] ?? "").trim() || null;
    if (!itemId || !body) continue;

    const createdAt = createdRaw ? new Date(createdRaw.replace(/\s+/g, " ")) : new Date();
    updates.push({
      mondayItemId: itemId,
      itemName,
      authorName,
      body,
      createdAt: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
      mondayPostId: postId,
    });
  }
  return updates;
}
