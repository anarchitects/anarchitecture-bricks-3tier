import {
  BadRequestException,
  Module,
  PayloadTooLargeException,
  ServiceUnavailableException,
  UnauthorizedException,
  type DynamicModule,
  type Provider,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import type { MailerPort } from '@anarchitects/common-nest-mailer';
import {
  CONSENT_REPOSITORY_PORT,
  SUBSCRIBER_PORT,
  NewsletterSubscriptionService,
  NewsletterWithdrawalService,
  NewsletterNativeLifecycleService,
  NATIVE_NEWSLETTER_ACTIONS,
  type NewsletterNativeActionsPort,
  type ConsentRepositoryPort,
  type SubscriberPort,
} from './application';
import {
  CryptoNativeToken,
  NativeSubscriberAdapter,
  NewsletterNativeMailService,
  NativeUnsubscribeService,
} from './infrastructure-native';
import {
  newsletterConfig,
  mapNewsletterConfigToOptions,
} from './config/newsletter.config';
import {
  validateNewsletterOptions,
  type NewsletterModuleOptions,
  type NewsletterModuleOverrides,
} from './config/module-options';
import {
  bindNewsletterProvider,
  requireNewsletterMethods,
} from './config/provider-binding';
import {
  MailerLiteSubscriberAdapter,
  MailerLiteWebhookAdapter,
  MailerLiteWebhookError,
} from './infrastructure-mailerlite';
import { NewsletterPresentationModule } from './presentation/newsletter-presentation.module';
import {
  NEWSLETTER_WEBHOOK_HANDLER,
  type NewsletterWebhookHandler,
} from './presentation/presentation-options';

@Module({})
class NewsletterRuntimeModule {}

/** Easy-mode facade. Hosts retain ownership of transports, evidence and limiting. */
@Module({})
export class NewsletterModule {
  static forRoot(options: NewsletterModuleOptions): DynamicModule {
    validateNewsletterOptions(options);
    const repository = Symbol('newsletter.configured-repository');
    const subscriber = Symbol('newsletter.configured-subscriber');
    const persistence = options.persistence;
    const providers: Provider[] = [
      persistence.mode === 'custom'
        ? bindNewsletterProvider(repository, persistence.provider)
        : {
            provide: repository,
            inject: [persistence.dataSourceToken],
            useFactory: async (dataSource: unknown) => {
              // Keep TypeORM optional for hosts supplying their own durable repository.
              const { TypeOrmConsentRepository } = await import(
                './infrastructure-persistence'
              );
              return new TypeOrmConsentRepository(
                dataSource as ConstructorParameters<
                  typeof TypeOrmConsentRepository
                >[0],
              );
            },
          },
      options.subscriber.mode === 'custom'
        ? bindNewsletterProvider(subscriber, options.subscriber.provider)
        : options.subscriber.mode === 'native'
          ? {
              provide: subscriber,
              inject: [
                NewsletterNativeLifecycleService,
                NewsletterNativeMailService,
              ],
              useFactory: (
                lifecycle: NewsletterNativeLifecycleService,
                mail: NewsletterNativeMailService,
              ) => new NativeSubscriberAdapter(lifecycle, mail),
            }
          : {
              provide: subscriber,
              useValue:
                options.subscriber.mode === 'noop'
                  ? { subscribe: async () => undefined }
                  : new MailerLiteSubscriberAdapter(options.subscriber.options),
            },
      {
        provide: CONSENT_REPOSITORY_PORT,
        inject: [repository],
        useFactory: (value: unknown) =>
          requireNewsletterMethods<ConsentRepositoryPort>(value, [
            'appendGrant',
            'appendWithdrawalOnce',
          ]),
      },
      {
        provide: SUBSCRIBER_PORT,
        inject: [subscriber],
        useFactory: (value: unknown) =>
          requireNewsletterMethods<SubscriberPort>(value, ['subscribe']),
      },
      {
        provide: NewsletterSubscriptionService,
        inject: [CONSENT_REPOSITORY_PORT, SUBSCRIBER_PORT],
        useFactory: (repo: ConsentRepositoryPort, adapter: SubscriberPort) =>
          new NewsletterSubscriptionService(repo, adapter, options.consent),
      },
      {
        provide: NewsletterWithdrawalService,
        inject: [CONSENT_REPOSITORY_PORT],
        useFactory: (repo: ConsentRepositoryPort) =>
          new NewsletterWithdrawalService(repo),
      },
    ];
    const exports = [
      CONSENT_REPOSITORY_PORT,
      SUBSCRIBER_PORT,
      NewsletterSubscriptionService,
      NewsletterWithdrawalService,
    ];
    if (
      options.subscriber.mode === 'native' &&
      persistence.mode === 'typeorm' &&
      options.mailer
    ) {
      const native = options.subscriber;
      const mailer = Symbol('newsletter.configured-mailer');
      providers.push(
        bindNewsletterProvider(mailer, options.mailer),
        {
          provide: NewsletterNativeMailService,
          inject: [mailer],
          useFactory: (value: unknown) =>
            new NewsletterNativeMailService(
              requireNewsletterMethods<MailerPort>(value, [
                'sendMessage',
                'send',
                'sendTemplate',
              ]),
              native.mail,
            ),
        },
        {
          provide: NewsletterNativeLifecycleService,
          inject: [persistence.dataSourceToken],
          useFactory: async (dataSource: unknown) => {
            const { TypeOrmNativeSubscriberRepository } = await import(
              './infrastructure-persistence'
            );
            return new NewsletterNativeLifecycleService(
              new TypeOrmNativeSubscriberRepository(
                dataSource as ConstructorParameters<
                  typeof TypeOrmNativeSubscriberRepository
                >[0],
              ),
              new CryptoNativeToken(),
              native.options,
            );
          },
        },
        {
          provide: NATIVE_NEWSLETTER_ACTIONS,
          inject: [
            NewsletterNativeLifecycleService,
            NewsletterNativeMailService,
          ],
          useFactory: (
            lifecycle: NewsletterNativeLifecycleService,
            mail: NewsletterNativeMailService,
          ): NewsletterNativeActionsPort => {
            const withdrawal = new NativeUnsubscribeService(lifecycle, mail);
            return {
              confirm: (token) => lifecycle.confirm(token),
              unsubscribe: (token) => withdrawal.unsubscribe(token),
            };
          },
        },
      );
      exports.push(NATIVE_NEWSLETTER_ACTIONS);
    }
    if (options.webhook) {
      const webhookOptions = options.webhook;
      providers.push({
        provide: NEWSLETTER_WEBHOOK_HANDLER,
        inject: [NewsletterWithdrawalService],
        useFactory: (
          withdrawals: NewsletterWithdrawalService,
        ): NewsletterWebhookHandler => {
          const adapter = new MailerLiteWebhookAdapter(
            webhookOptions,
            withdrawals,
          );
          return {
            receive: async (body, signature) => {
              try {
                return await adapter.receive(body, signature);
              } catch (error) {
                if (error instanceof MailerLiteWebhookError) {
                  if (error.code === 'invalid_signature')
                    throw new UnauthorizedException(
                      'Invalid newsletter webhook signature.',
                    );
                  if (error.code === 'invalid_payload')
                    throw new BadRequestException(
                      'Invalid newsletter webhook.',
                    );
                  if (error.code === 'payload_too_large')
                    throw new PayloadTooLargeException(
                      'Newsletter webhook is too large.',
                    );
                }
                throw new ServiceUnavailableException(
                  'Newsletter processing is temporarily unavailable.',
                );
              }
            },
          };
        },
      });
      exports.push(NEWSLETTER_WEBHOOK_HANDLER);
    }
    const runtime: DynamicModule = {
      module: NewsletterRuntimeModule,
      imports: options.imports ?? [],
      providers,
      exports,
    };
    const presentation = NewsletterPresentationModule.forRoot({
      ...options.presentation,
      rateLimit: options.rateLimit,
      webhookEnabled: !!options.webhook,
      nativeEnabled: options.subscriber.mode === 'native',
      imports: [runtime, ...(options.imports ?? [])],
    });
    return {
      module: NewsletterModule,
      imports: [runtime, presentation],
      exports: [runtime, presentation],
    };
  }

  static forRootFromConfig(
    overrides: NewsletterModuleOverrides = {},
  ): DynamicModule {
    const configured = this.forRoot(
      mapNewsletterConfigToOptions(newsletterConfig(), overrides),
    );
    return {
      ...configured,
      imports: [
        ConfigModule.forFeature(newsletterConfig),
        ...(configured.imports ?? []),
      ],
    };
  }
}
