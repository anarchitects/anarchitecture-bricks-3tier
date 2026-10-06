import {
  Controller,
  Inject,
  Post,
  Req,
  Res,
  HttpCode,
  BadRequestException,
  HttpException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RouteConfig, RouteSchema } from '@nestjs/platform-fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { NewsletterSubscriptionRouteSchema } from '@anarchitects/newsletter-ts/dtos';
import { NewsletterSubscriptionService } from '../application/subscription.service';
import { NewsletterValidationError } from '../application/newsletter.errors';
import {
  NEWSLETTER_RATE_LIMITER,
  type NewsletterRateLimiterPort,
} from './rate-limiter';
import {
  NEWSLETTER_PRESENTATION_OPTIONS,
  type NewsletterPresentationModuleOptions,
} from './presentation-options';

@Controller('newsletter')
export class NewsletterSubscriptionController {
  constructor(
    private readonly subscriptions: NewsletterSubscriptionService,
    @Inject(NEWSLETTER_PRESENTATION_OPTIONS)
    private readonly options: NewsletterPresentationModuleOptions,
    @Inject(NEWSLETTER_RATE_LIMITER)
    private readonly limiter: NewsletterRateLimiterPort | null,
  ) {}

  @Post('subscribe')
  @HttpCode(202)
  @RouteConfig({ newsletterSubscription: true })
  @RouteSchema(NewsletterSubscriptionRouteSchema)
  async subscribe(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    if (request.validationError)
      throw new BadRequestException('Invalid newsletter request.');
    if (this.options.rateLimit.mode !== 'disabled') {
      let result;
      try {
        const key = await this.options.resolveClientKey?.(request);
        if (
          typeof key !== 'string' ||
          !key.trim() ||
          key.length > 512 ||
          !this.limiter
        )
          throw new Error();
        result = await this.limiter.consume(key, this.options.rateLimit);
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
    let context;
    try {
      context = (await this.options.resolveContext?.(request)) ?? {};
    } catch {
      throw new ServiceUnavailableException(
        'Newsletter processing is temporarily unavailable.',
      );
    }
    try {
      return await this.subscriptions.subscribe(request.body, context);
    } catch (error) {
      if (error instanceof NewsletterValidationError)
        throw new BadRequestException('Invalid newsletter request.');
      throw new ServiceUnavailableException(
        'Newsletter processing is temporarily unavailable.',
      );
    }
  }
}

export function newsletterSubscriptionController(
  path: string,
): typeof NewsletterSubscriptionController {
  @Controller(path)
  class ConfiguredNewsletterSubscriptionController extends NewsletterSubscriptionController {}
  return ConfiguredNewsletterSubscriptionController;
}
