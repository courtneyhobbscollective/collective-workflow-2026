import fs from "node:fs";
import path from "node:path";

function parseEnvValue(line: string, prefix: string) {
  if (!line.startsWith(prefix)) return null;
  const value = line.slice(prefix.length).trim().replace(/^"|"$/g, "");
  return value || null;
}

/**
 * Ensures OpenAI env vars are set by reading `.env.local` then `.env` when missing.
 * Next injects env for the server, but this helps API routes match Prisma-style loading.
 */
export function loadOpenAiEnvFromEnvFiles() {
  const needKey = !process.env.OPENAI_API_KEY;
  const needModel = !process.env.OPENAI_MODEL;
  if (!needKey && !needModel) return;

  const files = [".env.local", ".env"];
  for (const file of files) {
    const envPath = path.join(process.cwd(), file);
    try {
      const raw = fs.readFileSync(envPath, "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        if (needKey && !process.env.OPENAI_API_KEY) {
          const key = parseEnvValue(trimmed, "OPENAI_API_KEY=");
          if (key) process.env.OPENAI_API_KEY = key;
        }
        if (needModel && !process.env.OPENAI_MODEL) {
          const model = parseEnvValue(trimmed, "OPENAI_MODEL=");
          if (model) process.env.OPENAI_MODEL = model;
        }
      }
    } catch {
      // ignore missing file
    }
  }
}
