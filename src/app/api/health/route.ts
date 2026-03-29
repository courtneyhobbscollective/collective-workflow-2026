import { NextResponse } from "next/server";
import { loadDatabaseUrlFromEnvFiles } from "@/lib/load-database-url";

export const runtime = "nodejs";

export async function GET() {
  loadDatabaseUrlFromEnvFiles();
  const hasUrl = Boolean(process.env.DATABASE_URL);

  let dbOk = false;
  let dbError: string | undefined;

  if (hasUrl) {
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch (e) {
      dbError = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json({
    ok: hasUrl && dbOk,
    cwd: process.cwd(),
    hasDatabaseUrl: hasUrl,
    databaseReachable: dbOk,
    databaseError: dbError ?? null,
    hint: !hasUrl
      ? "Add DATABASE_URL to .env.local (copy from .env.example) and restart the dev server."
      : !dbOk
        ? "DATABASE_URL is set but the database query failed. Is Postgres running?"
        : null,
  });
}
