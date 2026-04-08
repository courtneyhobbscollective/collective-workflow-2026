/**
 * One-off: set or rotate a user's password hash (bcrypt) so they can use /login.
 *
 * Usage (from workflow-mvp root, with DATABASE_URL in env):
 *   WORKFLOW_SET_PASSWORD='your-secret' npx tsx scripts/set-user-password.ts courtney@collective.com
 */

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const plain = process.env.WORKFLOW_SET_PASSWORD?.trim();
  if (!email) {
    console.error("Usage: WORKFLOW_SET_PASSWORD='...' npx tsx scripts/set-user-password.ts user@email.com");
    process.exit(1);
  }
  if (!plain) {
    console.error("Set WORKFLOW_SET_PASSWORD to the new password (not committed to shell history if you use env file).");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const passwordHash = await hashPassword(plain);
    const updated = await prisma.user.updateMany({
      where: { email },
      data: { passwordHash },
    });
    if (updated.count === 0) {
      console.error(`No user with email: ${email}`);
      process.exit(1);
    }
    console.log(`Password updated for ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
