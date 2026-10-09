import 'reflect-metadata';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import type Mail from 'nodemailer/lib/mailer';
import type MailMessage from 'nodemailer/lib/mailer/mail-message';
import type { Transport, SentMessageInfo } from 'nodemailer';
import {
  CommonMailerModule,
  MailerPort,
} from '@anarchitects/common-nest-mailer';
import { NewsletterModule } from '@anarchitects/newsletter-nest';
import { newsletterConfig } from '@anarchitects/newsletter-nest/config';
import {
  NewsletterSubscriptionService,
  type ConsentRepositoryPort,
} from '@anarchitects/newsletter-nest/application';
import { NewsletterPresentationModule } from '@anarchitects/newsletter-nest/presentation';
import { CryptoNativeToken } from '@anarchitects/newsletter-nest/infrastructure-native';
import { MailerLiteSubscriberAdapter } from '@anarchitects/newsletter-nest/infrastructure-mailerlite';
import {
  NewsletterConsentEntity,
  NewsletterNativeSubscriberEntity,
  NewsletterNativeTokenEntity,
} from '@anarchitects/newsletter-nest/infrastructure-persistence';
import type { NewsletterSubscriptionRequestDTO } from '@anarchitects/newsletter-ts/dtos';
import {
  createNewsletterApp,
  exampleConsent,
} from './example/app/create-app.js';
import { createNewsletterDataSource } from './example/app/data-source.js';

export const identities = {
  Module,
  NewsletterModule,
  NewsletterSubscriptionService,
  NewsletterPresentationModule,
  MailerPort,
};

class CaptureTransport implements Transport {
  name = 'newsletter-host';
  version = '1.0.0';
  messages: Mail.Options[] = [];
  closed = false;
  send(
    mail: MailMessage,
    done: (error: Error | null, info?: SentMessageInfo) => void,
  ) {
    this.messages.push(mail.data);
    done(null, { messageId: `newsletter-${this.messages.length}` });
  }
  close() {
    this.closed = true;
  }
}

async function post(
  app: NestFastifyApplication,
  path: string,
  payload: object | string,
  status: number,
  headers: Record<string, string> = {},
) {
  const response = await app.inject({
    method: 'POST',
    url: `/api/newsletter/${path}`,
    payload,
    headers: { 'content-type': 'application/json', ...headers },
  });
  assert.equal(response.statusCode, status, `${path}: ${response.body}`);
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['referrer-policy'], 'no-referrer');
  return response;
}

export async function runConsumer() {
  const url = process.env['NEWSLETTER_HOST_DATABASE_URL'];
  assert.ok(url);
  let source = await createNewsletterDataSource(url).initialize();
  let app: NestFastifyApplication | undefined;
  const originalFetch = globalThis.fetch;
  try {
    assert.equal(
      (await source.runMigrations({ transaction: 'all' })).length,
      2,
    );
    const transport = new CaptureTransport();
    const nativeOptions = {
      subscriber: {
        mode: 'native' as const,
        options: { scope: 'example-newsletter' },
        mail: {
          publicationName: 'Example newsletter',
          confirmationUrl: 'https://example.test/confirm',
          unsubscribeUrl: 'https://example.test/unsubscribe',
        },
      },
      mailerModule: {
        ...CommonMailerModule.forRoot({ provider: 'node' }),
        imports: [
          CommonMailerModule.forRootAsync({
            useFactory: () => ({
              transport,
              defaults: { from: 'news@example.test' },
            }),
          }),
        ],
      },
    };
    app = await createNewsletterApp({ dataSource: source, ...nativeOptions });
    const request: NewsletterSubscriptionRequestDTO = {
      email: 'Reader@Example.test',
      consent: true,
      consentVersion: exampleConsent.version,
      source: 'packed-host',
    };
    await post(app, 'subscribe', { ...request, consent: 'true' }, 400);
    await post(app, 'subscribe', { ...request, consentVersion: 'stale' }, 400);
    await post(app, 'subscribe', { email: 'bad', website: 'bot' }, 202);
    assert.equal(transport.messages.length, 0);
    assert.equal(
      await source.getRepository(NewsletterConsentEntity).count(),
      0,
    );
    assert.deepEqual((await post(app, 'subscribe', request, 202)).json(), {
      accepted: true,
    });
    assert.equal(transport.messages.length, 1);
    assert.equal(transport.messages[0].to, 'reader@example.test');
    assert.equal(transport.messages[0].from, 'news@example.test');
    const grant = await source
      .getRepository(NewsletterConsentEntity)
      .findOneByOrFail({ email: 'reader@example.test', kind: 'granted' });
    assert.equal(grant.consentVersion, exampleConsent.version);
    assert.equal(grant.consentText, exampleConsent.text);
    assert.equal(grant.source, 'packed-host');
    const links = String(transport.messages[0].text).match(
      /https:\/\/example\.test\/[^\s]+/g,
    );
    assert.equal(links?.length, 2);
    assert.ok(links);
    const tokens = links.map((link) => new URL(link).searchParams.get('token'));
    assert.ok(tokens.every(Boolean));
    const storedTokens = await source
      .getRepository(NewsletterNativeTokenEntity)
      .find();
    assert.equal(storedTokens.length, 2);
    for (const token of storedTokens) {
      assert.match(token.hash, /^[a-f0-9]{64}$/);
      assert.ok(!tokens.includes(token.hash));
    }
    assert.equal(
      (
        await app.inject({
          method: 'GET',
          url: `/api/newsletter/confirm?token=${tokens[0]}`,
        })
      ).statusCode,
      404,
    );
    await post(app, 'confirm', {}, 400);
    await post(app, 'webhook', {}, 404);
    await app.close();
    assert.equal(transport.closed, true);
    await source.destroy();
    source = await createNewsletterDataSource(url).initialize();
    assert.equal((await source.runMigrations()).length, 0);
    app = await createNewsletterApp({
      dataSource: source,
      ...nativeOptions,
      mailerModule: CommonMailerModule.forRoot({ provider: 'noop' }),
    });
    const state = async () =>
      (
        await source
          .getRepository(NewsletterNativeSubscriberEntity)
          .findOneByOrFail({ email: 'reader@example.test' })
      ).status;
    assert.equal(await state(), 'pending_confirmation');
    for (const [index, action] of ['confirm', 'unsubscribe'].entries()) {
      for (let replay = 0; replay < 2; replay++) {
        assert.deepEqual(
          (await post(app, action, { token: tokens[index] }, 202)).json(),
          { accepted: true },
        );
      }
      assert.equal(await state(), index === 0 ? 'active' : 'unsubscribed');
    }
    await post(app, 'confirm', { token: 'invalid' }, 202);
    assert.equal(await state(), 'unsubscribed');
    assert.equal(
      await source
        .getRepository(NewsletterConsentEntity)
        .countBy({ email: 'reader@example.test', kind: 'withdrawn' }),
      1,
    );
    console.log(
      'Native example: schema validation, migrations, captured Common Mailer delivery, restart, token replay and withdrawal passed.',
    );
    await app.close();

    let providerStatus = 201;
    const providerRequests: unknown[] = [];
    globalThis.fetch = async (input, init) => {
      assert.equal(
        String(input),
        'https://connect.mailerlite.com/api/subscribers',
      );
      providerRequests.push(JSON.parse(String(init?.body)));
      return new Response(null, { status: providerStatus });
    };
    const webhook = {
      accountId: '123',
      webhookSecret: 'fixture-only-secret',
      maxBodyBytes: 512,
    };
    const externalOptions = {
      subscriber: {
        mode: 'mailerlite' as const,
        options: { apiKey: 'fixture-only', groupId: '123', maxAttempts: 1 },
      },
      webhook,
      rateLimit: { mode: 'memory' as const, limit: 3, windowMs: 60_000 },
    };
    app = await createNewsletterApp({ dataSource: source, ...externalOptions });
    await post(
      app,
      'subscribe',
      { ...request, email: 'external@example.test' },
      202,
    );
    assert.deepEqual(providerRequests, [
      {
        email: 'external@example.test',
        status: 'unconfirmed',
        resubscribe: false,
        groups: ['123'],
      },
    ]);
    assert.equal(
      await source
        .getRepository(NewsletterNativeSubscriberEntity)
        .countBy({ email: 'external@example.test' }),
      0,
    );
    await post(app, 'confirm', { token: 'invalid' }, 404);
    providerStatus = 503;
    const unavailable = await post(
      app,
      'subscribe',
      { ...request, email: 'outage@example.test' },
      503,
    );
    assert.ok(!unavailable.body.includes('fixture-only'));
    providerStatus = 201;
    await post(
      app,
      'subscribe',
      { ...request, email: 'external@example.test' },
      202,
    );
    const limited = await post(app, 'subscribe', request, 429);
    assert.ok(limited.headers['retry-after']);
    const event = {
      event: 'subscriber.unsubscribed',
      account_id: 123,
      id: '456',
      email: 'external@example.test',
      unsubscribed_at: '2026-10-06T12:00:00Z',
    };
    const raw = JSON.stringify(event, null, 2) + '\n';
    const sign = (body: string) =>
      createHmac('sha256', webhook.webhookSecret).update(body).digest('hex');
    await post(app, 'webhook', '{', 400, { signature: sign('{') });
    await post(app, 'webhook', raw, 401);
    await post(app, 'webhook', raw, 401, { signature: 'invalid' });
    await post(app, 'webhook', JSON.stringify(event), 401, {
      signature: sign(raw),
    });
    const invalidAccount = JSON.stringify({ ...event, account_id: 999 });
    await post(app, 'webhook', invalidAccount, 400, {
      signature: sign(invalidAccount),
    });
    const oversized = JSON.stringify({ ...event, extra: 'x'.repeat(600) });
    await post(app, 'webhook', oversized, 413, { signature: sign(oversized) });
    assert.equal(
      await source
        .getRepository(NewsletterConsentEntity)
        .countBy({ email: event.email, kind: 'withdrawn' }),
      0,
    );
    const responses = await Promise.all([
      post(app, 'webhook', raw, 200, { signature: sign(raw) }),
      post(app, 'webhook', raw, 200, { signature: sign(raw) }),
    ]);
    assert.equal(
      responses.reduce(
        (total, response) => total + response.json().recorded,
        0,
      ),
      1,
    );
    assert.equal(
      responses.reduce(
        (total, response) => total + response.json().duplicates,
        0,
      ),
      1,
    );
    await app.close();
    app = await createNewsletterApp({ dataSource: source, ...externalOptions });
    assert.deepEqual(
      (await post(app, 'webhook', raw, 200, { signature: sign(raw) })).json(),
      { recorded: 0, duplicates: 1 },
    );
    assert.equal(
      await source
        .getRepository(NewsletterConsentEntity)
        .countBy({ email: event.email, kind: 'withdrawn' }),
      1,
    );
    console.log(
      'MailerLite example: provider errors, limits, exact raw-body signatures, rejection cases and durable webhook idempotency passed.',
    );
    await app.close();
    app = undefined;

    // Config defaults and explicit overrides with actual Nest module composition.
    process.env['NEWSLETTER_CONSENT_VERSION'] = 'configured/v1';
    process.env['NEWSLETTER_CONSENT_TEXT'] = 'Configured wording';
    process.env['NEWSLETTER_SUBSCRIBER'] = 'noop';
    process.env['NEWSLETTER_RATE_LIMIT_MODE'] = 'disabled';
    process.env['NEWSLETTER_PATH'] = 'configured';
    process.env['NEWSLETTER_MAILERLITE_WEBHOOK_ENABLED'] = 'true';
    const grants: unknown[] = [];
    const repository: ConsentRepositoryPort = {
      appendGrant: async (grant) => {
        grants.push(grant);
      },
      appendWithdrawalOnce: async () => 'recorded',
    };
    const context = await Test.createTestingModule({
      imports: [
        NewsletterModule.forRootFromConfig({
          persistence: { mode: 'custom', provider: { useValue: repository } },
          webhook: false,
          consent: { text: 'Override wording' },
          presentation: { path: 'overridden' },
        }),
      ],
    }).compile();
    app = context.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
      { logger: false },
    );
    await app.init();
    const response = await app.inject({
      method: 'POST',
      url: '/overridden/subscribe',
      payload: { ...request, consentVersion: 'configured/v1' },
    });
    assert.equal(response.statusCode, 202, response.body);
    assert.equal(grants.length, 1);
    assert.match(JSON.stringify(grants), /Override wording/);
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: '/overridden/webhook',
          payload: {},
        })
      ).statusCode,
      404,
    );
    assert.equal(newsletterConfig().consentText, 'Configured wording');
    assert.ok(new CryptoNativeToken().issue('confirm').hash);
    assert.ok(
      new MailerLiteSubscriberAdapter({
        apiKey: 'fixture-only',
        groupId: '123',
      }),
    );
    console.log(
      'Config namespace, explicit overrides, provider binding and disabled routes passed.',
    );
  } finally {
    globalThis.fetch = originalFetch;
    await app?.close();
    if (source.isInitialized) await source.destroy();
  }
}
