import {
  Module,
  type DynamicModule,
  type NestModule,
  type Provider,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { FastifyInstance } from 'fastify';
import { Value } from '@sinclair/typebox/value';
import type { TSchema } from '@sinclair/typebox';
import {
  bindNewsletterProvider,
  requireNewsletterMethods,
} from '../config/provider-binding';
import { validateNewsletterPresentationOptions } from '../config/module-options';
import {
  NEWSLETTER_PRESENTATION_OPTIONS,
  type NewsletterPresentationModuleOptions,
} from './presentation-options';
import {
  InMemoryNewsletterRateLimiter,
  NEWSLETTER_RATE_LIMITER,
  type NewsletterRateLimiterPort,
} from './rate-limiter';
import { newsletterSubscriptionController } from './newsletter-subscription.controller';
import { newsletterWebhookController } from './newsletter-webhook.controller';
import { newsletterNativeController } from './newsletter-native.controller';

const configured = new WeakSet<FastifyInstance>();

@Module({})
export class NewsletterPresentationModule implements NestModule {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  configure(): void {
    const adapter = this.adapterHost.httpAdapter;
    if (adapter?.getType() !== 'fastify')
      throw new Error('Newsletter presentation requires Fastify.');
    const instance = adapter.getInstance<FastifyInstance>();
    if (configured.has(instance)) return;
    configured.add(instance);
    // Register before Nest maps routes. Other host routes retain their own validation.
    instance.addHook('onRoute', (route) => {
      const config = route.config as Record<string, unknown> | undefined;
      if (
        !config?.['newsletterSubscription'] &&
        !config?.['newsletterNativeAction']
      )
        return;
      route.attachValidation = true;
      route.validatorCompiler =
        ({ schema }) =>
        (data) =>
          Value.Check(schema as TSchema, data)
            ? { value: data }
            : { error: new Error('Invalid newsletter request.') };
      if (!config?.['newsletterSubscription']) return;
      const previous = route.preValidation ? [route.preValidation].flat() : [];
      route.preValidation = [
        async (request, reply) => {
          const body = request.body;
          if (
            body &&
            typeof body === 'object' &&
            'website' in body &&
            typeof body.website === 'string' &&
            body.website.length > 0
          ) {
            await reply.code(202).send({ accepted: true });
          }
        },
        ...previous,
      ];
    });
  }

  static forRoot(options: NewsletterPresentationModuleOptions): DynamicModule {
    validateNewsletterPresentationOptions(options.rateLimit, options);
    const providers: Provider[] = [
      { provide: NEWSLETTER_PRESENTATION_OPTIONS, useValue: options },
    ];
    if (options.rateLimit.mode === 'custom') {
      const custom = Symbol('newsletter.custom-limiter');
      providers.push(
        bindNewsletterProvider(custom, options.rateLimit.provider),
        {
          provide: NEWSLETTER_RATE_LIMITER,
          inject: [custom],
          useFactory: (value: unknown) =>
            requireNewsletterMethods<NewsletterRateLimiterPort>(value, [
              'consume',
            ]),
        },
      );
    } else
      providers.push({
        provide: NEWSLETTER_RATE_LIMITER,
        useValue:
          options.rateLimit.mode === 'memory'
            ? new InMemoryNewsletterRateLimiter(options.rateLimit.maxKeys)
            : null,
      });
    return {
      module: NewsletterPresentationModule,
      imports: options.imports ?? [],
      providers,
      controllers: [
        newsletterSubscriptionController(options.path ?? 'newsletter'),
        ...(options.nativeEnabled
          ? [newsletterNativeController(options.path ?? 'newsletter')]
          : []),
        ...(options.webhookEnabled
          ? [newsletterWebhookController(options.path ?? 'newsletter')]
          : []),
      ],
      exports: [NEWSLETTER_RATE_LIMITER],
    };
  }
}
