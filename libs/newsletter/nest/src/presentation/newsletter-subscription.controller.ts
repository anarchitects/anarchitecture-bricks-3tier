import { enforceNewsletterRateLimit } from './enforce-rate-limit';
import {
  Controller,
  Inject,
  Post,
  Req,
  Res,
  HttpCode,
  BadRequestException,
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
    @Inject(NewsletterSubscriptionService)
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
    await enforceNewsletterRateLimit(
      request,
      reply,
      this.options,
      this.limiter,
    );
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
