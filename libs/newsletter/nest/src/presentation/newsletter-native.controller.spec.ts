import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import {
  NATIVE_NEWSLETTER_ACTIONS,
  NewsletterSubscriptionService,
} from '../application';
import { NewsletterPresentationModule } from './newsletter-presentation.module';
import type { NewsletterPresentationModuleOptions } from './presentation-options';

const apps: NestFastifyApplication[] = [];
async function setup(
  overrides: Partial<NewsletterPresentationModuleOptions> = {},
) {
  const actions = {
    confirm: jest.fn(async () => undefined),
    unsubscribe: jest.fn(async () => undefined),
  };
  @Module({
    providers: [
      { provide: NATIVE_NEWSLETTER_ACTIONS, useValue: actions },
      {
        provide: NewsletterSubscriptionService,
        useValue: { subscribe: async () => ({ accepted: true }) },
      },
    ],
    exports: [NATIVE_NEWSLETTER_ACTIONS, NewsletterSubscriptionService],
  })
  class HostActions {}
  const module = await Test.createTestingModule({
    imports: [
      NewsletterPresentationModule.forRoot({
        imports: [HostActions],
        nativeEnabled: true,
        path: 'marketing/news',
        rateLimit: { mode: 'disabled' },
        ...overrides,
      }),
    ],
  }).compile();
  const app = module.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
    { logger: false },
  );
  apps.push(app);
  app.setGlobalPrefix('api');
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return { app, actions };
}
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});
const post = (app: NestFastifyApplication, action: string, payload: unknown) =>
  app.inject({
    method: 'POST',
    url: '/api/marketing/news/' + action,
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify(payload),
  });

describe('native action HTTP boundary', () => {
  it.each(['confirm', 'unsubscribe'] as const)(
    'returns neutral no-store acknowledgements for %s',
    async (action) => {
      const { app, actions } = await setup();
      for (const token of ['', 'malformed', 'v1.c.' + 'a'.repeat(43)]) {
        const response = await post(app, action, { token });
        expect(response.statusCode).toBe(202);
        expect(response.json()).toEqual({ accepted: true });
        expect(response.headers['cache-control']).toBe('no-store');
        expect(response.headers['referrer-policy']).toBe('no-referrer');
        expect(actions[action]).toHaveBeenLastCalledWith(token);
      }
      expect(
        (
          await app.inject({
            method: 'GET',
            url: '/api/marketing/news/' + action + '?token=private',
          })
        ).statusCode,
      ).toBe(404);
      expect(actions[action]).toHaveBeenCalledTimes(3);
    },
  );
  it.each([
    {},
    { token: 12 },
    { token: null },
    { token: ['secret'] },
    { token: 'x'.repeat(129) },
    { token: 'secret', website: 'bot' },
    { token: 'secret', email: 'private@example.test' },
  ])(
    'rejects invalid shape without coercion or honeypot bypass: %j',
    async (payload) => {
      const { app, actions } = await setup();
      for (const action of ['confirm', 'unsubscribe'] as const) {
        const response = await post(app, action, payload);
        expect(response.statusCode).toBe(400);
        expect(response.json().message).toBe('Invalid newsletter request.');
        expect(response.body).not.toContain('private');
        expect(actions[action]).not.toHaveBeenCalled();
      }
    },
  );
  it('fails closed with a generic response on persistence or handler failure', async () => {
    const { app, actions } = await setup();
    for (const action of ['confirm', 'unsubscribe'] as const) {
      actions[action].mockRejectedValue(
        new Error('private token/database details'),
      );
      const response = await post(app, action, { token: 'secret' });
      expect(response.statusCode).toBe(503);
      expect(response.body).not.toContain('private');
      expect(response.body).not.toContain('secret');
      expect(response.headers['cache-control']).toBe('no-store');
    }
  });
  it('shares one host-key budget across native actions and subscriptions', async () => {
    const { app, actions } = await setup({
      rateLimit: { mode: 'memory', limit: 1, windowMs: 60000 },
      resolveClientKey: (req) => req.ip,
    });
    expect((await post(app, 'confirm', { token: 'invalid' })).statusCode).toBe(
      202,
    );
    const response = await post(app, 'unsubscribe', { token: 'invalid' });
    expect(response.statusCode).toBe(429);
    expect(response.headers['retry-after']).toBe('60');
    expect(actions.unsubscribe).not.toHaveBeenCalled();
    expect(
      (
        await post(app, 'subscribe', {
          email: 'a@example.test',
          consent: true,
          consentVersion: 'v1',
        })
      ).statusCode,
    ).toBe(429);
  });
  it('does not expose native actions unless explicitly enabled', async () => {
    const { app, actions } = await setup({ nativeEnabled: false });
    for (const action of ['confirm', 'unsubscribe'] as const) {
      expect((await post(app, action, { token: 'secret' })).statusCode).toBe(
        404,
      );
      expect(actions[action]).not.toHaveBeenCalled();
    }
  });
});
