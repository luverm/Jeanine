import "server-only";

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();
let lastSweepAt = 0;

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

function maybeSweep(now: number) {
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export type RateLimitOptions = {
  /** Limit identifier (e.g. "lead:10.0.0.1"). */
  key: string;
  /** Maximum number of allowed events within the window. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * Fixed-window in-memory rate limiter. Per-process — fine for a single
 * Vercel instance handling low traffic; swap for Upstash when we need
 * cross-region accuracy.
 */
export function rateLimit(opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  maybeSweep(now);

  const bucket = store.get(opts.key);
  if (!bucket || bucket.resetAt <= now) {
    const fresh: Bucket = { count: 1, resetAt: now + opts.windowMs };
    store.set(opts.key, fresh);
    return { ok: true, remaining: opts.max - 1, resetAt: fresh.resetAt };
  }

  if (bucket.count >= opts.max) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return {
    ok: true,
    remaining: opts.max - bucket.count,
    resetAt: bucket.resetAt,
  };
}

/** Test-only: clear the in-memory store. */
export function _resetRateLimitStore(): void {
  store.clear();
  lastSweepAt = 0;
}
