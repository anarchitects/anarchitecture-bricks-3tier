import 'reflect-metadata';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { NewsletterModule } from '@anarchitects/newsletter-nest';
import { NewsletterSubscriptionService } from '@anarchitects/newsletter-nest/application';
import { NewsletterPresentationModule } from '@anarchitects/newsletter-nest/presentation';
import { CryptoNativeToken } from '@anarchitects/newsletter-nest/infrastructure-native';
import { MailerLiteSubscriberAdapter } from '@anarchitects/newsletter-nest/infrastructure-mailerlite';

const require = createRequire(import.meta.url);
for (const dependency of [
  'typeorm',
  'pg',
  '@anarchitects/common-nest-mailer',
  '@nestjs-modules/mailer',
  'nodemailer',
]) {
  assert.throws(() => require.resolve(dependency), {
    code: 'MODULE_NOT_FOUND',
  });
}
assert.equal(
  require('@anarchitects/newsletter-nest').NewsletterModule,
  NewsletterModule,
);
assert.ok(new CryptoNativeToken().issue('confirm').hash);
assert.ok(
  new MailerLiteSubscriberAdapter({ apiKey: 'fixture-only', groupId: '123' }),
);

for (const mode of ['custom', 'noop', 'advanced', 'missing-raw-body']) {
  const order = [];
  const repository = {
    appendGrant: async () => {
      order.push('grant');
    },
    appendWithdrawalOnce: async () => 'recorded',
  };
  const subscriber = {
    subscribe: async () => {
      order.push('provider');
    },
  };
  const consent = { version: 'host/v1', text: 'Host wording' };
  let allowed = true;
  const limiter = {
    consume: async () =>
      allowed ? { allowed: true } : { allowed: false, retryAfterMs: 1000 },
  };
  const rateLimit = {
    mode: 'custom',
    provider: { useValue: limiter },
    limit: 1,
    windowMs: 1000,
  };
  const presentation = {
    path: 'host-newsletter',
    resolveClientKey: (request) => request.ip,
  };
  const options = {
    consent,
    persistence: { mode: 'custom', provider: { useValue: repository } },
    subscriber:
      mode === 'noop'
        ? { mode: 'noop' }
        : { mode: 'custom', provider: { useFactory: () => subscriber } },
    rateLimit,
    presentation,
    ...(mode === 'missing-raw-body'
      ? { webhook: { accountId: '123', webhookSecret: 'fixture-only' } }
      : {}),
  };
  class PortsModule {}
  Module({
    providers: [
      {
        provide: NewsletterSubscriptionService,
        useValue: new NewsletterSubscriptionService(
          repository,
          subscriber,
          consent,
        ),
      },
    ],
    exports: [NewsletterSubscriptionService],
  })(PortsModule);
  const moduleRef = await Test.createTestingModule({
    imports: [
      mode === 'advanced'
        ? NewsletterPresentationModule.forRoot({
            imports: [PortsModule],
            ...presentation,
            rateLimit,
          })
        : NewsletterModule.forRoot(options),
    ],
  }).compile();
  // Deliberately omit rawBody for the fail-closed webhook scenario.
  const app = moduleRef.createNestApplication(new FastifyAdapter(), {
    logger: false,
  });
  try {
    await app.init();
    const response = await app.inject({
      method: 'POST',
      url: '/host-newsletter/subscribe',
      payload: {
        email: 'reader@example.test',
        consent: true,
        consentVersion: consent.version,
      },
    });
    assert.equal(response.statusCode, 202, response.body);
    assert.deepEqual(
      order,
      mode === 'noop' ? ['grant'] : ['grant', 'provider'],
    );
    allowed = false;
    const limited = await app.inject({
      method: 'POST',
      url: '/host-newsletter/subscribe',
      payload: {
        email: 'reader@example.test',
        consent: true,
        consentVersion: consent.version,
      },
    });
    assert.equal(limited.statusCode, 429);
    assert.equal(limited.headers['retry-after'], '1');
    const webhook = await app.inject({
      method: 'POST',
      url: '/host-newsletter/webhook',
      payload: {},
    });
    assert.equal(
      webhook.statusCode,
      mode === 'missing-raw-body' ? 503 : 404,
      webhook.body,
    );
    assert.equal(
      (
        await app.inject({
          method: 'POST',
          url: '/host-newsletter/confirm',
          payload: { token: 'invalid' },
        })
      ).statusCode,
      404,
    );
  } finally {
    await app.close();
  }
}
console.log(
  'Clean optional-peer host: CJS/ESM loading, custom/noop providers, advanced composition, custom limiter and missing raw-body rejection passed.',
);
