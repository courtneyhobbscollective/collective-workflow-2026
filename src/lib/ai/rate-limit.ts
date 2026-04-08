type Bucket = {
  count: number;
  windowStartMs: number;
};

const WINDOW_MS = 60_000;
const LIMIT_PER_WINDOW = 12;

const globalStore = globalThis as unknown as {
  aiRateLimit?: Map<string, Bucket>;
};

if (!globalStore.aiRateLimit) {
  globalStore.aiRateLimit = new Map<string, Bucket>();
}

const buckets = globalStore.aiRateLimit;

export function checkAiRateLimit(userId: string): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = buckets.get(userId);

  if (!existing || now - existing.windowStartMs >= WINDOW_MS) {
    buckets.set(userId, { count: 1, windowStartMs: now });
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= LIMIT_PER_WINDOW) {
    const retryAfterSeconds = Math.max(1, Math.ceil((WINDOW_MS - (now - existing.windowStartMs)) / 1000));
    return { ok: false, retryAfterSeconds };
  }

  existing.count += 1;
  buckets.set(userId, existing);
  return { ok: true, retryAfterSeconds: 0 };
}

