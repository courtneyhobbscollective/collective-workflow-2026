import fs from "node:fs";
import path from "node:path";

/**
 * Ensures `process.env.DATABASE_URL` is set by reading `.env.local` then `.env`
 * when it is missing. Next usually injects env before runtime, but Prisma is
 * imported early; this avoids hard crashes on "Missing DATABASE_URL" in some setups.
 */
export function loadDatabaseUrlFromEnvFiles() {
  if (process.env.DATABASE_URL) return;

  const files = [".env.local", ".env"];
  for (const file of files) {
    const envPath = path.join(process.cwd(), file);
    try {
      const raw = fs.readFileSync(envPath, "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        if (!trimmed.startsWith("DATABASE_URL=")) continue;
        const value = trimmed.replace(/^DATABASE_URL=/, "").trim().replace(/^"|"$/g, "");
        if (value) {
          process.env.DATABASE_URL = value;
          return;
        }
      }
    } catch {
      // ignore missing file
    }
  }
}
