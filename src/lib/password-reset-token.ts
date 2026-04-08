import { createHash, randomBytes } from "node:crypto";

export function generateResetTokenParts(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  const hash = hashResetToken(raw);
  return { raw, hash };
}

export function hashResetToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}
