/**
 * Ensure Collective Digital staff accounts exist with the correct roles.
 *
 * Usage (from project root, DATABASE_URL in env):
 *   npx tsx scripts/ensure-collective-staff.ts
 */

import { PrismaClient, UserRole } from "@prisma/client";

const STAFF: { email: string; fullName: string; role: UserRole }[] = [
  { email: "courtney@collectivedigital.uk", fullName: "Courtney Hobbs", role: UserRole.admin },
  { email: "jen@collectivedigital.uk", fullName: "Jen", role: UserRole.admin },
  { email: "dan@collectivedigital.uk", fullName: "Dan", role: UserRole.team_member },
];

async function main() {
  const prisma = new PrismaClient();
  try {
    for (const person of STAFF) {
      const user = await prisma.user.upsert({
        where: { email: person.email },
        create: {
          email: person.email,
          fullName: person.fullName,
          role: person.role,
        },
        update: {
          fullName: person.fullName,
          role: person.role,
          clientId: null,
        },
        select: { email: true, fullName: true, role: true },
      });
      console.log(`✓ ${user.email} — ${user.fullName} (${user.role})`);
    }
    console.log("\nSet passwords with:");
    console.log("  WORKFLOW_SET_PASSWORD='…' npx tsx scripts/set-user-password.ts courtney@collectivedigital.uk");
  } finally {
    await prisma.$disconnect();
  }
}

void main();
