import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";
import { loadDatabaseUrlFromEnvFiles } from "@/lib/load-database-url";

/** Avoid ESM/Turbopack resolving a trimmed `@prisma/client` graph; always load the full Node client. */
const require = createRequire(import.meta.url);
const { PrismaClient: PrismaClientConstructor } = require("@prisma/client") as {
  PrismaClient: new (args?: { datasources?: { db?: { url: string } } }) => PrismaClient;
};

type GlobalForPrisma = {
  prisma?: PrismaClient;
  prismaUrl?: string;
  /** `mtimeMs` of `node_modules/.prisma/client/index.js` when we last constructed the client. */
  prismaGeneratedMtime?: number;
};

const globalForPrisma = globalThis as unknown as GlobalForPrisma;

loadDatabaseUrlFromEnvFiles();

const currentUrl = process.env.DATABASE_URL;
if (!currentUrl) {
  throw new Error(
    "Missing DATABASE_URL. Copy .env.example to .env.local, set DATABASE_URL, then restart. Diagnostics: GET /api/health"
  );
}

const isDev = process.env.NODE_ENV !== "production";

function getPrismaGeneratedBundleMtime(): number {
  try {
    const clientJs = path.join(process.cwd(), "node_modules/.prisma/client/index.js");
    return fs.statSync(clientJs).mtimeMs;
  } catch {
    return 0;
  }
}

const generatedMtime = getPrismaGeneratedBundleMtime();
const generatedBundleChanged =
  isDev &&
  generatedMtime > 0 &&
  globalForPrisma.prismaGeneratedMtime !== generatedMtime;

const shouldRecreate =
  !globalForPrisma.prisma ||
  globalForPrisma.prismaUrl !== currentUrl ||
  generatedBundleChanged;

let prismaInstance: PrismaClient;

if (shouldRecreate) {
  if (isDev && globalForPrisma.prisma) {
    void globalForPrisma.prisma.$disconnect().catch(() => {});
  }
  prismaInstance = new PrismaClientConstructor({
    datasources: { db: { url: currentUrl } },
  });
} else {
  prismaInstance = globalForPrisma.prisma!;
}

if (shouldRecreate) {
  globalForPrisma.prisma = prismaInstance;
  globalForPrisma.prismaUrl = currentUrl;
  globalForPrisma.prismaGeneratedMtime = generatedMtime;
}

export { prismaInstance as prisma };
