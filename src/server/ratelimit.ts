/**
 * Best-effort in-memory rate limiting.
 *
 * Honest limitation (documented in KNOWN-LIMITATIONS.md): Cloudflare runs
 * Functions in many isolates, so an in-memory counter is per-isolate, not
 * global. This stops casual abuse and runaway loops; determined abuse needs
 * Cloudflare WAF rules (see docs/DEPLOYMENT.md, "Hardening").
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
/** Periodic sweep so the map cannot grow without bound. */
const MAX_BUCKETS = 10_000

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetInSeconds: number
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k)
  }
  const existing = buckets.get(key)
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, resetInSeconds: Math.ceil(windowMs / 1000) }
  }
  existing.count += 1
  const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
  if (existing.count > limit) {
    return { ok: false, remaining: 0, resetInSeconds }
  }
  return { ok: true, remaining: limit - existing.count, resetInSeconds }
}

export function clientKey(request: Request): string {
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  return ip
}
