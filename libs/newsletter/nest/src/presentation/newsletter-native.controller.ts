import {
  BadRequestException,
  Controller,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RouteConfig, RouteSchema } from '@nestjs/platform-fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  NewsletterNativeActionRouteSchema,
  type NewsletterNativeActionRequestDTO,
  type NewsletterNativeActionResponseDTO,
} from '@anarchitects/newsletter-ts/dtos';
import {
  NATIVE_NEWSLETTER_ACTIONS,
  type NewsletterNativeActionsPort,
} from '../application';
import {
  NEWSLETTER_PRESENTATION_OPTIONS,
  type NewsletterPresentationModuleOptions,
} from './presentation-options';
import {
  NEWSLETTER_RATE_LIMITER,
  type NewsletterRateLimiterPort,
} from './rate-limiter';
import { enforceNewsletterRateLimit } from './enforce-rate-limit';

@Controller('newsletter')
export class NewsletterNativeController {
  constructor(
    @Inject(NATIVE_NEWSLETTER_ACTIONS)
    private readonly actions: NewsletterNativeActionsPort,
    @Inject(NEWSLETTER_PRESENTATION_OPTIONS)
    private readonly options: NewsletterPresentationModuleOptions,
    @Inject(NEWSLETTER_RATE_LIMITER)
    private readonly limiter: NewsletterRateLimiterPort | null,
  ) {}

  @Post('confirm')
  @HttpCode(202)
  @RouteConfig({ newsletterNativeAction: true })
  @RouteSchema(NewsletterNativeActionRouteSchema)
  confirm(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    return this.act('confirm', request, reply);
  }

  @Post('unsubscribe')
  @HttpCode(202)
  @RouteConfig({ newsletterNativeAction: true })
  @RouteSchema(NewsletterNativeActionRouteSchema)
  unsubscribe(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    return this.act('unsubscribe', request, reply);
  }

  private async act(
    action: 'confirm' | 'unsubscribe',
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<NewsletterNativeActionResponseDTO> {
    reply.header('Cache-Control', 'no-store');
    reply.header('Referrer-Policy', 'no-referrer');
    if (request.validationError)
      throw new BadRequestException('Invalid newsletter request.');
    await enforceNewsletterRateLimit(
      request,
      reply,
      this.options,
      this.limiter,
    );
    try {
      await this.actions[action](
        (request.body as NewsletterNativeActionRequestDTO).token,
      );
    } catch {
      throw new ServiceUnavailableException(
        'Newsletter processing is temporarily unavailable.',
      );
    }
    return { accepted: true };
  }
}

export function newsletterNativeController(
  path: string,
): typeof NewsletterNativeController {
  @Controller(path)
  class ConfiguredNewsletterNativeController extends NewsletterNativeController {}
  return ConfiguredNewsletterNativeController;
}
