import { Test } from '@nestjs/testing';
import { NewsletterModule } from './newsletter.module';
import {
  NewsletterSubscriptionService,
  CONSENT_REPOSITORY_PORT,
  SUBSCRIBER_PORT,
} from './application';
import {
  newsletterConfig,
  mapNewsletterConfigToOptions,
  NewsletterOptionsError,
  type NewsletterConfig,
  type NewsletterModuleOptions,
} from './config';
import { MailerLiteSubscriberAdapter } from './infrastructure-mailerlite';

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
