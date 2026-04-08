import { PrismaClient } from "@prisma/client";
import { loadDatabaseUrlFromEnvFiles } from "@/lib/load-database-url";

type GlobalForPrisma = {
  prisma?: PrismaClient;
};

const globalForPrisma = globalThis as unknown as GlobalForPrisma;

loadDatabaseUrlFromEnvFiles();

const currentUrl = process.env.DATABASE_URL;
if (!currentUrl) {
  throw new Error(
    "Missing DATABASE_URL. Copy .env.example to .env.local, set DATABASE_URL, then restart. Diagnostics: GET /api/health"
  );
}

function createClient(): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: currentUrl } },
  });
}

/**
 * Shared Prisma client. With `serverExternalPackages: ["@prisma/client"]` in next.config,
 * Next/Turbopack loads the real package from node_modules (not a stale bundled copy).
 */
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createClient();
}
export const prisma = globalForPrisma.prisma;

/** Alias for clarity in server actions; same instance as `prisma`. */
export function getPrisma(): PrismaClient {
  return prisma;
}
