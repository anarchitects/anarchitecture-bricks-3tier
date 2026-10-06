import { InMemoryNewsletterRateLimiter } from './rate-limiter';

const policy = { limit: 2, windowMs: 1000 };
describe('explicit memory limiter', () => {
  it('atomically consumes quota for concurrent callers and isolates keys', async () => {
    const limiter = new InMemoryNewsletterRateLimiter(10, () => 100);
    const results = await Promise.all(
      Array.from({ length: 5 }, () => limiter.consume('key', policy)),
    );
    expect(results.filter((value) => value.allowed)).toHaveLength(2);
    expect(results.slice(2)).toEqual(
      Array(3).fill({ allowed: false, retryAfterMs: 1000 }),
    );
    expect(await limiter.consume('other', policy)).toEqual({ allowed: true });
  });
  it('reports remaining time, resets expired quota and reclaims expired capacity', async () => {
    let now = 0;
    const limiter = new InMemoryNewsletterRateLimiter(1, () => now);
    await limiter.consume('key', policy);
    await limiter.consume('key', policy);
    now = 250;
    expect(await limiter.consume('key', policy)).toEqual({
      allowed: false,
      retryAfterMs: 750,
    });
    await expect(limiter.consume('other', policy)).rejects.toThrow('capacity');
    now = 1000;
    expect(await limiter.consume('other', policy)).toEqual({ allowed: true });
    await expect(limiter.consume('key', policy)).rejects.toThrow('capacity');
    now = 2000;
    expect(await limiter.consume('other', policy)).toEqual({ allowed: true });
  });
});
