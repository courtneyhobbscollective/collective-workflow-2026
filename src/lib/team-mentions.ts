/** Match @Full Name mentions (case-insensitive). Excludes the sender. */
export function userIdsMentionedInText(
  text: string,
  candidates: { id: string; fullName: string }[],
  senderId: string
): string[] {
  const lower = text.toLowerCase();
  const seen = new Set<string>();
  for (const u of candidates) {
    if (u.id === senderId || !u.fullName.trim()) continue;
    const needle = `@${u.fullName}`.toLowerCase();
    if (needle.length > 1 && lower.includes(needle)) {
      seen.add(u.id);
    }
  }
  return [...seen];
}
