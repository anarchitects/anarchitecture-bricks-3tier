import type { NewsletterRateLimitPolicy } from '../config/module-options';

export const NEWSLETTER_RATE_LIMITER = Symbol('newsletter.rate-limiter');
export type NewsletterRateLimitResult =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly retryAfterMs: number };
export interface NewsletterRateLimiterPort {
  /** Atomic consume; keys must be host-resolved and namespaced when shared across apps. */
  consume(
    key: string,
    policy: NewsletterRateLimitPolicy,
  ): Promise<NewsletterRateLimitResult>;
}

/** Explicit single-instance fixed window. No timer, eviction of active keys or global singleton. */
export class InMemoryNewsletterRateLimiter
  implements NewsletterRateLimiterPort
{
  private readonly entries = new Map<
    string,
    { count: number; expires: number }
  >();
  constructor(
    private readonly maxKeys = 10000,
    private readonly now: () => number = Date.now,
  ) {
    if (!Number.isSafeInteger(maxKeys) || maxKeys < 1)
      throw new Error('Invalid limiter capacity.');
  }
  async consume(
    key: string,
    policy: NewsletterRateLimitPolicy,
  ): Promise<NewsletterRateLimitResult> {
    if (
      !key ||
      key.length > 512 ||
      !Number.isSafeInteger(policy.limit) ||
      policy.limit < 1 ||
      !Number.isSafeInteger(policy.windowMs) ||
      policy.windowMs < 1
    )
      throw new Error('Invalid limiter input.');
    const now = this.now();
    if (!Number.isFinite(now)) throw new Error('Invalid limiter clock.');
    let entry = this.entries.get(key);
    if (!entry || entry.expires <= now) {
      if (this.entries.size >= this.maxKeys) {
        for (const [storedKey, value] of this.entries)
          if (value.expires <= now) this.entries.delete(storedKey);
        if (this.entries.size >= this.maxKeys)
          throw new Error('Limiter capacity exhausted.');
      }
      entry = { count: 0, expires: now + policy.windowMs };
      this.entries.set(key, entry);
    }
    if (entry.count >= policy.limit)
      return { allowed: false, retryAfterMs: entry.expires - now };
    entry.count++;
    return { allowed: true };
  }
}
