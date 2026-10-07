import { Test } from '@nestjs/testing';
import { Module } from '@nestjs/common';
import { NewsletterModule } from './newsletter.module';
import {
  NewsletterSubscriptionService,
  CONSENT_REPOSITORY_PORT,
  SUBSCRIBER_PORT,
  NATIVE_NEWSLETTER_ACTIONS,
  NewsletterConfigurationError,
} from './application';
import {
  newsletterConfig,
  mapNewsletterConfigToOptions,
  NewsletterOptionsError,
  type NewsletterConfig,
  type NewsletterModuleOptions,
} from './config';
import { MailerLiteSubscriberAdapter } from './infrastructure-mailerlite';
import { NativeSubscriberAdapter } from './infrastructure-native';

const repository = {
  appendGrant: jest.fn(async () => undefined),
  appendWithdrawalOnce: jest.fn(async () => 'recorded' as const),
};
const options: NewsletterModuleOptions = {
  consent: { version: 'v1', text: 'wording' },
  persistence: { mode: 'custom', provider: { useValue: repository } },
  subscriber: { mode: 'noop' },
  rateLimit: { mode: 'disabled' },
};
const blank = Object.fromEntries(
  Object.keys(newsletterConfig()).map((key) => [key, undefined]),
) as NewsletterConfig;
const envNames = [
  'NEWSLETTER_CONSENT_VERSION',
  'NEWSLETTER_CONSENT_TEXT',
  'NEWSLETTER_SUBSCRIBER',
  'NEWSLETTER_RATE_LIMIT_MODE',
  'NEWSLETTER_MAILERLITE_WEBHOOK_ENABLED',
  'NEWSLETTER_NATIVE_SCOPE',
  'NEWSLETTER_PUBLICATION_NAME',
  'NEWSLETTER_CONFIRMATION_URL',
  'NEWSLETTER_UNSUBSCRIBE_URL',
];
let saved: (string | undefined)[];
beforeEach(() => {
  saved = envNames.map((name) => process.env[name]);
  envNames.forEach((name) => delete process.env[name]);
  jest.clearAllMocks();
});
afterEach(() =>
  envNames.forEach((name, index) => {
    if (saved[index] === undefined) delete process.env[name];
    else process.env[name] = saved[index];
  }),
);

describe('Newsletter configuration', () => {
  const nativeSubscriber: NewsletterModuleOptions['subscriber'] = {
    mode: 'native',
    options: { scope: 'host' },
    mail: {
      publicationName: 'Host news',
      confirmationUrl: 'https://host.example.test/confirm',
      unsubscribeUrl: 'https://host.example.test/unsubscribe',
    },
  };
  const nativeOptions: NewsletterModuleOptions = {
    ...options,
    persistence: { mode: 'typeorm', dataSourceToken: 'host-database' },
    subscriber: nativeSubscriber,
    mailer: {
      useValue: {
        sendMessage: async () => undefined,
        send: async () => undefined,
        sendTemplate: async () => undefined,
      },
    },
  };
  const nativeConfig: NewsletterConfig = {
    ...blank,
    subscriber: 'native',
    nativeScope: 'env-scope',
    publicationName: 'Env news',
    confirmationUrl: 'https://env.example.test/confirm',
    unsubscribeUrl: 'https://env.example.test/unsubscribe',
    consentVersion: 'env-v',
    consentText: 'Env wording',
    rateLimit: 'disabled',
  };
  @Module({
    providers: [
      { provide: 'host-database', useValue: { options: { type: 'postgres' } } },
    ],
    exports: ['host-database'],
  })
  class HostDatabase {}

  it('maps native settings without MailerLite credentials, and applies explicit subscriber overrides atomically', () => {
    const mapped = mapNewsletterConfigToOptions(nativeConfig, {
      persistence: nativeOptions.persistence,
      mailer: nativeOptions.mailer,
    });
    expect(mapped.subscriber).toMatchObject({
      mode: 'native',
      options: { scope: 'env-scope', confirmationTtlMs: undefined },
      mail: { publicationName: 'Env news', maxAttempts: undefined },
    });
    const overridden = mapNewsletterConfigToOptions(
      { ...nativeConfig, notifyUnsubscribe: 'invalid' },
      { ...nativeOptions, imports: [HostDatabase] },
    );
    expect(overridden.subscriber).toEqual(nativeSubscriber);
    expect(
      mapNewsletterConfigToOptions(nativeConfig, { ...options }).subscriber,
    ).toEqual({ mode: 'noop' });
    expect(
      mapNewsletterConfigToOptions(nativeConfig, {
        ...options,
        subscriber: {
          mode: 'mailerlite',
          options: { apiKey: 'test', groupId: '123' },
        },
      }).subscriber.mode,
    ).toBe('mailerlite');
  });
  it('maps native TTLs, presentation metadata and bounded retry values from config', () => {
    const mapped = mapNewsletterConfigToOptions(
      {
        ...nativeConfig,
        confirmationTtlMs: '120000',
        unsubscribeTtlMs: '240000',
        resendCooldownMs: '1000',
        notifyUnsubscribe: 'false',
        mailMaxAttempts: '2',
        mailRetryDelayMs: '0',
        mailFrom: 'news@example.test',
        mailReplyTo: 'help@example.test',
      },
      { persistence: nativeOptions.persistence, mailer: nativeOptions.mailer },
    );
    expect(mapped.subscriber).toMatchObject({
      options: {
        confirmationTtlMs: 120000,
        unsubscribeTtlMs: 240000,
        resendCooldownMs: 1000,
      },
      mail: {
        notifyUnsubscribe: false,
        maxAttempts: 2,
        retryDelayMs: 0,
        message: { from: 'news@example.test', replyTo: 'help@example.test' },
      },
    });
  });
  it('requires durable shared persistence and explicit mail wiring for native mode', () => {
    for (const patch of [
      { persistence: options.persistence },
      { mailer: undefined },
    ]) {
      expect(() =>
        NewsletterModule.forRoot({ ...nativeOptions, ...patch }),
      ).toThrow(NewsletterOptionsError);
    }
  });
  it('boots native forRoot and forRootFromConfig independently of MailerLite', async () => {
    process.env['NEWSLETTER_SUBSCRIBER'] = 'native';
    process.env['NEWSLETTER_CONSENT_VERSION'] = 'v1';
    process.env['NEWSLETTER_CONSENT_TEXT'] = 'Host wording';
    process.env['NEWSLETTER_RATE_LIMIT_MODE'] = 'disabled';
    process.env['NEWSLETTER_NATIVE_SCOPE'] = 'host';
    process.env['NEWSLETTER_PUBLICATION_NAME'] = 'Host news';
    process.env['NEWSLETTER_CONFIRMATION_URL'] =
      'https://host.example.test/confirm';
    process.env['NEWSLETTER_UNSUBSCRIBE_URL'] =
      'https://host.example.test/unsubscribe';
    for (const configured of [
      NewsletterModule.forRoot({ ...nativeOptions, imports: [HostDatabase] }),
      NewsletterModule.forRootFromConfig({
        imports: [HostDatabase],
        persistence: nativeOptions.persistence,
        mailer: nativeOptions.mailer,
      }),
    ]) {
      const module = await Test.createTestingModule({
        imports: [configured],
      }).compile();
      try {
        expect(module.get(SUBSCRIBER_PORT)).toBeInstanceOf(
          NativeSubscriberAdapter,
        );
        expect(module.get(NATIVE_NEWSLETTER_ACTIONS)).toMatchObject({
          confirm: expect.any(Function),
          unsubscribe: expect.any(Function),
        });
      } finally {
        await module.close();
      }
    }
  });
  it.each([
    { confirmationUrl: 'http://unsafe.example.test' },
    { nativeScope: '' },
    { mailMaxAttempts: '4' },
    { mailRetryDelayMs: '' },
    { confirmationTtlMs: 'oops' },
  ])('rejects invalid native configuration at bootstrap: %j', async (patch) => {
    const mapped = mapNewsletterConfigToOptions(
      { ...nativeConfig, ...patch },
      {
        imports: [HostDatabase],
        persistence: nativeOptions.persistence,
        mailer: nativeOptions.mailer,
      },
    );
    await expect(
      Test.createTestingModule({
        imports: [NewsletterModule.forRoot(mapped)],
      }).compile(),
    ).rejects.toThrow(NewsletterConfigurationError);
  });
  it.each(['consent', 'persistence', 'subscriber', 'rateLimit'])(
    'requires explicit %s configuration',
    (key) => {
      expect(() =>
        NewsletterModule.forRoot({ ...options, [key]: undefined }),
      ).toThrow(NewsletterOptionsError);
    },
  );
  it.each([
    { rateLimit: { mode: 'memory', limit: 1, windowMs: 1000 } },
    { rateLimit: { mode: 'disabled-typo' } },
    { consent: { version: 12, text: 'wording' } },
    { presentation: { path: 'newsletter\n' } },
    { presentation: { path: '/absolute' } },
    {
      persistence: {
        mode: 'custom',
        provider: { useValue: repository, useExisting: 'ambiguous' },
      },
    },
  ])('rejects invalid options %j', (patch) => {
    expect(() =>
      NewsletterModule.forRoot({
        ...options,
        ...patch,
      } as NewsletterModuleOptions),
    ).toThrow(NewsletterOptionsError);
  });
  it('maps environment options with explicit overrides taking precedence', () => {
    const config: NewsletterConfig = {
      ...blank,
      consentVersion: 'env-v',
      consentText: 'env wording',
      subscriber: 'mailerlite',
      apiKey: 'test-key',
      groupId: '123',
      rateLimit: 'memory',
      limit: '3',
      windowMs: '1000',
      path: 'env-news',
      webhookEnabled: 'true',
      accountId: '123',
      webhookSecret: 'test-secret',
    };
    const mapped = mapNewsletterConfigToOptions(config, {
      persistence: options.persistence,
      consent: { version: 'override-v' },
      presentation: { resolveClientKey: () => 'key' },
    });
    expect(mapped.consent).toEqual({
      version: 'override-v',
      text: 'env wording',
    });
    expect(mapped.rateLimit).toEqual({
      mode: 'memory',
      limit: 3,
      windowMs: 1000,
    });
    expect(mapped.webhook).toEqual({
      accountId: '123',
      webhookSecret: 'test-secret',
    });
    expect(mapped.presentation?.path).toBe('env-news');
    expect(() => NewsletterModule.forRoot(mapped)).not.toThrow();
    const overridden = mapNewsletterConfigToOptions(
      {
        ...config,
        subscriber: 'invalid',
        rateLimit: 'invalid',
        webhookEnabled: 'invalid',
      },
      { ...options, webhook: false, presentation: { path: 'host' } },
    );
    expect(overridden).toMatchObject({
      ...options,
      webhook: false,
      presentation: { path: 'host' },
    });
  });
  it('keeps explicit forRoot independent from environment', async () => {
    process.env['NEWSLETTER_SUBSCRIBER'] = 'invalid';
    process.env['NEWSLETTER_CONSENT_VERSION'] = 'different';
    const module = await Test.createTestingModule({
      imports: [NewsletterModule.forRoot(options)],
    }).compile();
    try {
      await expect(
        module.get(NewsletterSubscriptionService).subscribe({
          email: 'reader@example.test',
          consent: true,
          consentVersion: 'v1',
        }),
      ).resolves.toEqual({ accepted: true });
    } finally {
      await module.close();
    }
  });
  it('supports config-driven bootstrap with host persistence and explicit overrides', async () => {
    process.env['NEWSLETTER_CONSENT_VERSION'] = 'env-v';
    process.env['NEWSLETTER_CONSENT_TEXT'] = 'env wording';
    process.env['NEWSLETTER_SUBSCRIBER'] = 'noop';
    process.env['NEWSLETTER_RATE_LIMIT_MODE'] = 'disabled';
    const module = await Test.createTestingModule({
      imports: [
        NewsletterModule.forRootFromConfig({
          persistence: options.persistence,
          consent: { version: 'host-v' },
          webhook: false,
          presentation: { path: 'host' },
        }),
      ],
    }).compile();
    try {
      await module.get(NewsletterSubscriptionService).subscribe({
        email: 'reader@example.test',
        consent: true,
        consentVersion: 'host-v',
      });
      expect(repository.appendGrant).toHaveBeenCalledWith(
        expect.objectContaining({
          consentVersion: 'host-v',
          consentText: 'env wording',
        }),
      );
    } finally {
      await module.close();
    }
  });
  it('does not infer missing adapters or limiter from configuration', () => {
    expect(() =>
      NewsletterModule.forRoot(mapNewsletterConfigToOptions(blank)),
    ).toThrow(NewsletterOptionsError);
    expect(() =>
      mapNewsletterConfigToOptions(
        { ...blank, webhookEnabled: 'yes' },
        options,
      ),
    ).toThrow(NewsletterOptionsError);
  });
  it('registers MailerLite only when selected and rejects missing credentials', async () => {
    expect(() =>
      NewsletterModule.forRoot({
        ...options,
        subscriber: {
          mode: 'mailerlite',
          options: { apiKey: '', groupId: '123' },
        },
      }),
    ).toThrow('Invalid MailerLite');
    const module = await Test.createTestingModule({
      imports: [
        NewsletterModule.forRoot({
          ...options,
          subscriber: {
            mode: 'mailerlite',
            options: { apiKey: 'test-key', groupId: '123' },
          },
        }),
      ],
    }).compile();
    try {
      expect(module.get(SUBSCRIBER_PORT)).toBeInstanceOf(
        MailerLiteSubscriberAdapter,
      );
      expect(module.get(CONSENT_REPOSITORY_PORT)).toBe(repository);
    } finally {
      await module.close();
    }
  });
});
