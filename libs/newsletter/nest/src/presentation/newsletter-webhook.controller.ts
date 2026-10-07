import {
  Controller,
  Inject,
  Post,
  Req,
  HttpCode,
  HttpException,
  ServiceUnavailableException,
  type RawBodyRequest,
} from '@nestjs/common';
import { RouteSchema } from '@nestjs/platform-fastify';
import { NewsletterWebhookRouteSchema } from '@anarchitects/newsletter-ts/dtos';
import type { FastifyRequest } from 'fastify';
import {
  NEWSLETTER_WEBHOOK_HANDLER,
  type NewsletterWebhookHandler,
} from './presentation-options';

@Controller('newsletter')
export class NewsletterWebhookController {
  constructor(
    @Inject(NEWSLETTER_WEBHOOK_HANDLER)
    private readonly handler: NewsletterWebhookHandler,
  ) {}
  @Post('webhook')
  @HttpCode(200)
  @RouteSchema(NewsletterWebhookRouteSchema)
  async receive(@Req() request: RawBodyRequest<FastifyRequest>) {
    if (!request.rawBody)
      throw new ServiceUnavailableException(
        'Newsletter webhook raw body is unavailable.',
      );
    try {
      return await this.handler.receive(
        request.rawBody,
        request.headers['signature'],
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException(
        'Newsletter processing is temporarily unavailable.',
      );
    }
  }
}
export function newsletterWebhookController(
  path: string,
): typeof NewsletterWebhookController {
  @Controller(path)
  class ConfiguredNewsletterWebhookController extends NewsletterWebhookController {}
  return ConfiguredNewsletterWebhookController;
}
