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

/** Spot-check delegates added after a long-running dev session may be missing from the singleton. */
function clientHasDealBoardDelegate(client: PrismaClient): boolean {
  return (
    typeof (client as unknown as { dealBoard?: { findMany?: unknown } }).dealBoard?.findMany ===
    "function"
  );
}

function getOrCreateClient(): PrismaClient {
  let client = globalForPrisma.prisma;
  if (client && clientHasDealBoardDelegate(client)) {
    return client;
  }

  if (client) {
    void client.$disconnect().catch(() => undefined);
  }

  client = createClient();
  globalForPrisma.prisma = client;

  if (!clientHasDealBoardDelegate(client)) {
    throw new Error(
      "Prisma client is missing deal-board models. Stop the dev server completely (Ctrl+C), run `npx prisma generate`, then start `npm run dev` again. Hot reload does not reload the Prisma client."
    );
  }

  return client;
}

/**
 * Shared Prisma client. With `serverExternalPackages: ["@prisma/client"]` in next.config,
 * Next/Turbopack loads the real package from node_modules (not a stale bundled copy).
 */
export const prisma = getOrCreateClient();

/** Alias for clarity in server actions; same instance as `prisma`. */
export function getPrisma(): PrismaClient {
  return prisma;
}
