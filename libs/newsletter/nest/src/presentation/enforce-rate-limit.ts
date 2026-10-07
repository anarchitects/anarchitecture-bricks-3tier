import { HttpException, ServiceUnavailableException } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { NewsletterPresentationModuleOptions } from './presentation-options';
import type { NewsletterRateLimiterPort } from './rate-limiter';

/** Shared budget for subscription and native actions; keys come only from the host resolver. */
export async function enforceNewsletterRateLimit(
  request: FastifyRequest,
  reply: FastifyReply,
  options: NewsletterPresentationModuleOptions,
  limiter: NewsletterRateLimiterPort | null,
): Promise<void> {
  if (options.rateLimit.mode !== 'disabled') {
    let result;
    try {
      const key = await options.resolveClientKey?.(request);
      if (
        typeof key !== 'string' ||
        !key.trim() ||
        key.length > 512 ||
        !limiter
      )
        throw new Error();
      result = await limiter.consume(key, options.rateLimit);
      if (
        !result ||
        typeof result.allowed !== 'boolean' ||
        (!result.allowed &&
          (!Number.isFinite(result.retryAfterMs) || result.retryAfterMs <= 0))
      )
        throw new Error();
    } catch {
      throw new ServiceUnavailableException(
        'Newsletter processing is temporarily unavailable.',
      );
    }
    if (!result.allowed) {
      reply.header(
        'Retry-After',
        String(Math.ceil(result.retryAfterMs / 1000)),
      );
      throw new HttpException('Too many newsletter requests.', 429);
    }
  }
}
