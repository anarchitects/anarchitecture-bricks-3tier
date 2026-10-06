import { createHmac } from 'node:crypto';
import { NewsletterSubscriptionRouteSchema } from '@anarchitects/newsletter-ts/dtos';
import { Controller, Post, Body, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { NewsletterModule } from './newsletter.module';
import { RouteSchema } from '@nestjs/platform-fastify';
import { NewsletterPresentationModule } from './presentation';
import { TypeOrmConsentRepository } from './infrastructure-persistence';
import type { NewsletterModuleOptions } from './config/module-options';
import {
  CONSENT_REPOSITORY_PORT,
  NewsletterSubscriptionService,
  type ConsentRepositoryPort,
} from './application';

const policy = { version: 'host/v1', text: 'Host consent wording.' };
const request = {
  email: 'Reader@Example.test',
  consent: true,
  consentVersion: policy.version,
};
const webhook = { webhookSecret: 'test-only-secret', accountId: '123' };
const event = {
  event: 'subscriber.unsubscribed',
  id: '100',
  email: 'reader@example.test',
  unsubscribed_at: '2026-10-06T12:00:00Z',
};
const signature = (body: string) =>
  createHmac('sha256', webhook.webhookSecret).update(body).digest('hex');
const applications: NestFastifyApplication[] = [];
async function setup(
  overrides: Partial<NewsletterModuleOptions> = {},
  rawBody = true,
) {
  const repository = {
    appendGrant: jest
      .fn<
        ReturnType<ConsentRepositoryPort['appendGrant']>,
        Parameters<ConsentRepositoryPort['appendGrant']>
      >()
      .mockResolvedValue(undefined),
    appendWithdrawalOnce: jest
      .fn<
        ReturnType<ConsentRepositoryPort['appendWithdrawalOnce']>,
        Parameters<ConsentRepositoryPort['appendWithdrawalOnce']>
      >()
      .mockResolvedValue('recorded'),
  };
  const subscriber = { subscribe: jest.fn(async () => undefined) };
  const options: NewsletterModuleOptions = {
    consent: policy,
    persistence: { mode: 'custom', provider: { useValue: repository } },
    subscriber: { mode: 'custom', provider: { useValue: subscriber } },
    rateLimit: { mode: 'disabled' },
    ...overrides,
  };
  const module = await Test.createTestingModule({
    imports: [NewsletterModule.forRoot(options)],
  }).compile();
  const app = module.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
    { rawBody, logger: false },
  );
  applications.push(app);
  app.setGlobalPrefix('api');
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return { app, repository, subscriber, options };
}
afterEach(async () => {
  await Promise.all(applications.splice(0).map((app) => app.close()));
});
const subscribe = (app: NestFastifyApplication, payload: unknown = request) =>
  app.inject({
    method: 'POST',
    url: '/api/newsletter/subscribe',
    payload: JSON.stringify(payload),
    headers: { 'content-type': 'application/json' },
  });

describe('Newsletter Fastify facade', () => {
  it('exports services and commits host policy before provider calls with the same neutral response on repetition', async () => {
    const { app, repository, subscriber } = await setup();
    expect(app.get(NewsletterSubscriptionService)).toBeInstanceOf(
      NewsletterSubscriptionService,
    );
    expect(app.get(CONSENT_REPOSITORY_PORT)).toBe(repository);
    for (let i = 0; i < 2; i++) {
      const response = await subscribe(app);
      expect(response.statusCode).toBe(202);
      expect(response.json()).toEqual({ accepted: true });
    }
    expect(repository.appendGrant).toHaveBeenCalledTimes(2);
    expect(repository.appendGrant.mock.calls[0]).toEqual([
      expect.objectContaining({
        email: 'reader@example.test',
        consentVersion: policy.version,
        consentText: policy.text,
      }),
    ]);
    expect(repository.appendGrant.mock.invocationCallOrder[0]).toBeLessThan(
      subscriber.subscribe.mock.invocationCallOrder[0],
    );
    expect(repository.appendGrant.mock.calls[0][0]).not.toHaveProperty(
      'ipAddress',
    );
  });
  it.each([
    { ...request, consent: 'true' },
    { ...request, consent: false },
    { ...request, email: 'invalid' },
    { ...request, consentVersion: 'old' },
    { ...request, unexpected: 'strip me' },
    {},
  ])(
    'rejects invalid requests without coercing or removing fields: %j',
    async (payload) => {
      const { app, repository, subscriber } = await setup();
      const response = await subscribe(app, payload);
      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Invalid newsletter request.');
      expect(repository.appendGrant).not.toHaveBeenCalled();
      expect(subscriber.subscribe).not.toHaveBeenCalled();
    },
  );
  it('acknowledges malformed honeypots before validation, context and rate limiting', async () => {
    const consume = jest.fn();
    const resolveClientKey = jest.fn();
    const resolveContext = jest.fn();
    const { app, repository, subscriber } = await setup({
      rateLimit: {
        mode: 'custom',
        provider: { useValue: { consume } },
        limit: 1,
        windowMs: 1000,
      },
      presentation: { resolveClientKey, resolveContext },
    });
    const response = await subscribe(app, {
      website: 'bot',
      email: 42,
      consent: 'false',
      unknown: true,
    });
    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({ accepted: true });
    for (const spy of [
      consume,
      resolveClientKey,
      resolveContext,
      repository.appendGrant,
      subscriber.subscribe,
    ])
      expect(spy).not.toHaveBeenCalled();
  });
  it('limits genuine requests and supplies Retry-After without writing denied evidence', async () => {
    const { app, repository } = await setup({
      rateLimit: { mode: 'memory', limit: 1, windowMs: 60000 },
      presentation: { resolveClientKey: (req) => req.ip },
    });
    expect((await subscribe(app)).statusCode).toBe(202);
    const response = await subscribe(app);
    expect(response.statusCode).toBe(429);
    expect(response.headers['retry-after']).toBe('60');
    expect(repository.appendGrant).toHaveBeenCalledTimes(1);
    const other = await setup({
      rateLimit: { mode: 'memory', limit: 1, windowMs: 60000 },
      presentation: { resolveClientKey: (req) => req.ip },
    });
    expect((await subscribe(other.app)).statusCode).toBe(202);
  });
  it.each([undefined, '', ' '.repeat(2)])(
    'fails closed for missing limiter key %j',
    async (key) => {
      const { app, repository } = await setup({
        rateLimit: { mode: 'memory', limit: 1, windowMs: 1000 },
        presentation: { resolveClientKey: () => key },
      });
      expect((await subscribe(app)).statusCode).toBe(503);
      expect(repository.appendGrant).not.toHaveBeenCalled();
    },
  );
  it('maps limiter failures to generic 503', async () => {
    const { app, repository } = await setup({
      rateLimit: {
        mode: 'custom',
        limit: 1,
        windowMs: 1000,
        provider: {
          useFactory: () => ({
            consume: () => {
              throw new Error('private limiter detail');
            },
          }),
        },
      },
      presentation: { resolveClientKey: () => 'host-key' },
    });
    const response = await subscribe(app);
    expect(response.statusCode).toBe(503);
    expect(response.body).not.toContain('private');
    expect(repository.appendGrant).not.toHaveBeenCalled();
  });
  it('uses host context and route prefix without trusting forwarded headers automatically', async () => {
    const { app, repository } = await setup({
      presentation: {
        path: 'marketing/news',
        resolveContext: (req) => ({ ipAddress: req.ip }),
      },
    });
    const response = await app.inject({
      method: 'POST',
      url: '/api/marketing/news/subscribe',
      payload: request,
      headers: { 'x-forwarded-for': '198.51.100.99' },
    });
    expect(response.statusCode).toBe(202);
    expect(repository.appendGrant.mock.calls[0][0]).toHaveProperty(
      'ipAddress',
      '127.0.0.1',
    );
    expect((await subscribe(app)).statusCode).toBe(404);
  });
  it('supports imported useExisting repositories and injected custom subscriber factories', async () => {
    const repo = { appendGrant: jest.fn(), appendWithdrawalOnce: jest.fn() };
    const adapter = { subscribe: jest.fn() };
    @Module({
      providers: [
        { provide: 'host-repo', useValue: repo },
        { provide: 'host-adapter', useValue: adapter },
      ],
      exports: ['host-repo', 'host-adapter'],
    })
    class HostModule {}
    const { app } = await setup({
      imports: [HostModule],
      persistence: { mode: 'custom', provider: { useExisting: 'host-repo' } },
      subscriber: {
        mode: 'custom',
        provider: {
          useFactory: (value: unknown) => value,
          inject: ['host-adapter'],
        },
      },
    });
    expect((await subscribe(app)).statusCode).toBe(202);
    expect(repo.appendGrant).toHaveBeenCalled();
    expect(adapter.subscribe).toHaveBeenCalled();
  });
  it.each(['repository', 'subscriber'])(
    'maps %s outages to generic retryable HTTP failures',
    async (failing) => {
      const { app, repository, subscriber } = await setup();
      (failing === 'repository'
        ? repository.appendGrant
        : subscriber.subscribe
      ).mockRejectedValueOnce(new Error('private database/provider detail'));
      const response = await subscribe(app);
      expect(response.statusCode).toBe(503);
      expect(response.body).not.toContain('private');
      if (failing === 'repository')
        expect(subscriber.subscribe).not.toHaveBeenCalled();
    },
  );
  it('registers no webhook route by default', async () => {
    const { app } = await setup();
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/newsletter/webhook',
          payload: event,
        })
      ).statusCode,
    ).toBe(404);
  });
  it('verifies the exact signed bytes, maps duplicates and bypasses subscription limiting', async () => {
    const resolveClientKey = jest.fn();
    const { app, repository } = await setup({
      webhook,
      rateLimit: { mode: 'memory', limit: 1, windowMs: 1000 },
      presentation: { resolveClientKey },
    });
    const body = JSON.stringify(event, null, 2) + '\n';
    const post = () =>
      app.inject({
        method: 'POST',
        url: '/api/newsletter/webhook',
        payload: body,
        headers: {
          'content-type': 'application/json',
          signature: signature(body),
        },
      });
    const response = await post();
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ recorded: 1, duplicates: 0 });
    repository.appendWithdrawalOnce.mockResolvedValueOnce('duplicate');
    expect((await post()).json()).toEqual({ recorded: 0, duplicates: 1 });
    expect(resolveClientKey).not.toHaveBeenCalled();
    expect(repository.appendWithdrawalOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        email: event.email,
        eventSource: 'mailerlite:123',
      }),
    );
  });
  it('rejects signatures over reserialized JSON before writes', async () => {
    const { app, repository } = await setup({ webhook });
    const response = await app.inject({
      method: 'POST',
      url: '/api/newsletter/webhook',
      payload: JSON.stringify(event, null, 2),
      headers: {
        'content-type': 'application/json',
        signature: signature(JSON.stringify(event)),
      },
    });
    expect(response.statusCode).toBe(401);
    expect(repository.appendWithdrawalOnce).not.toHaveBeenCalled();
  });
  it('fails closed when the host omitted raw-body capture', async () => {
    const { app, repository } = await setup({ webhook }, false);
    const body = JSON.stringify(event);
    const response = await app.inject({
      method: 'POST',
      url: '/api/newsletter/webhook',
      payload: body,
      headers: {
        'content-type': 'application/json',
        signature: signature(body),
      },
    });
    expect(response.statusCode).toBe(503);
    expect(repository.appendWithdrawalOnce).not.toHaveBeenCalled();
  });
  it.each([
    ['payload', 400],
    ['size', 413],
    ['storage', 503],
  ] as const)(
    'does not acknowledge webhook %s failures',
    async (kind, status) => {
      const { app, repository } = await setup({
        webhook: {
          ...webhook,
          ...(kind === 'size' ? { maxBodyBytes: 1 } : {}),
        },
      });
      if (kind === 'storage')
        repository.appendWithdrawalOnce.mockRejectedValueOnce(
          new Error('private storage detail'),
        );
      const body = JSON.stringify(
        kind === 'payload' ? { event: 'subscriber.unsubscribed' } : event,
      );
      const response = await app.inject({
        method: 'POST',
        url: '/api/newsletter/webhook',
        payload: body,
        headers: {
          'content-type': 'application/json',
          signature: signature(body),
        },
      });
      expect(response.statusCode).toBe(status);
      expect(response.body).not.toContain('private');
    },
  );
  it('supports advanced presentation composition without the facade or infrastructure', async () => {
    const repository = {
      appendGrant: jest.fn(),
      appendWithdrawalOnce: jest.fn(),
    };
    const service = new NewsletterSubscriptionService(
      repository,
      { subscribe: async () => undefined },
      policy,
    );
    @Module({
      providers: [
        { provide: NewsletterSubscriptionService, useValue: service },
      ],
      exports: [NewsletterSubscriptionService],
    })
    class HostApplicationModule {}
    const module = await Test.createTestingModule({
      imports: [
        NewsletterPresentationModule.forRoot({
          imports: [HostApplicationModule],
          rateLimit: { mode: 'disabled' },
        }),
      ],
    }).compile();
    const app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
      { logger: false },
    );
    applications.push(app);
    app.setGlobalPrefix('api');
    await app.init();
    expect((await subscribe(app)).statusCode).toBe(202);
    expect(repository.appendGrant).toHaveBeenCalled();
  });
  it('selects the TypeORM adapter using a host-owned DataSource token', async () => {
    const insert = jest.fn(async () => undefined);
    const datasource = {
      options: { type: 'postgres' },
      getRepository: () => ({ insert }),
    };
    @Module({
      providers: [{ provide: 'host-datasource', useValue: datasource }],
      exports: ['host-datasource'],
    })
    class HostDatabaseModule {}
    const { app } = await setup({
      imports: [HostDatabaseModule],
      persistence: { mode: 'typeorm', dataSourceToken: 'host-datasource' },
    });
    expect(app.get(CONSENT_REPOSITORY_PORT)).toBeInstanceOf(
      TypeOrmConsentRepository,
    );
    expect((await subscribe(app)).statusCode).toBe(202);
    expect(insert).toHaveBeenCalled();
  });
  it('preserves unrelated host route validation', async () => {
    @Controller('host')
    class HostController {
      @Post()
      @RouteSchema(NewsletterSubscriptionRouteSchema)
      accept(@Body() body: unknown) {
        return body;
      }
    }
    @Module({ controllers: [HostController] })
    class HostRoutesModule {}
    const { app } = await setup({ imports: [HostRoutesModule] });
    const response = await app.inject({
      method: 'POST',
      url: '/api/host',
      payload: { ...request, consent: 'true', extra: 'removed' },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual(request);
    expect(
      (await subscribe(app, { ...request, consent: 'true' })).statusCode,
    ).toBe(400);
  });
  it('requires valid custom provider methods at startup', async () => {
    await expect(
      setup({ subscriber: { mode: 'custom', provider: { useValue: {} } } }),
    ).rejects.toThrow('Invalid Newsletter module configuration.');
  });
  it('allows explicit no-op subscription while still committing consent', async () => {
    const { app, repository } = await setup({ subscriber: { mode: 'noop' } });
    expect((await subscribe(app)).statusCode).toBe(202);
    expect(repository.appendGrant).toHaveBeenCalled();
  });
});
