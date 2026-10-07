import 'reflect-metadata';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { Module } from '@nestjs/common';
import { GenericContainer, Wait } from 'testcontainers';
import { chromium } from 'playwright';
import {
  MailerPort,
  type MailerMessage,
} from '@anarchitects/common-nest-mailer';
import {
  NewsletterConsentEntity,
  NewsletterNativeSubscriberEntity,
} from '@anarchitects/newsletter-nest/infrastructure-persistence';
import {
  NewsletterSubscriptionRequestSchema,
  NewsletterSubscriptionResponseSchema,
} from '@anarchitects/newsletter-ts/dtos';
import { Value } from '@sinclair/typebox/value';
import { createNewsletterApp, exampleConsent } from '../src/app/create-app';
import { createNewsletterDataSource } from '../src/app/data-source';

@Module({})
class CapturedMailModule {}

async function run() {
  const container = await new GenericContainer('postgres:16-alpine')
    .withEnvironment({
      POSTGRES_DB: 'newsletter',
      POSTGRES_USER: 'postgres',
      POSTGRES_PASSWORD: 'postgres',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forListeningPorts())
    .start();
  const source = createNewsletterDataSource(
    `postgres://postgres:postgres@${container.getHost()}:${container.getMappedPort(5432)}/newsletter`,
  );
  let app: Awaited<ReturnType<typeof createNewsletterApp>> | undefined;
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  let server: ReturnType<typeof createServer> | undefined;
  const originalFetch = globalThis.fetch;
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        await source.initialize();
        break;
      } catch (error) {
        if (attempt === 29) throw error;
        await delay(250);
      }
    }
    assert.equal(
      (await source.runMigrations({ transaction: 'all' })).length,
      2,
    );
    const messages: MailerMessage[] = [];
    const mailerModule = {
      module: CapturedMailModule,
      providers: [
        {
          provide: MailerPort,
          useValue: {
            sendMessage: async (message: MailerMessage) => {
              messages.push(message);
            },
            send: async () => undefined,
            sendTemplate: async () => undefined,
          },
        },
      ],
      exports: [MailerPort],
    };
    app = await createNewsletterApp({
      dataSource: source,
      mailerModule,
      subscriber: {
        mode: 'native',
        options: { scope: 'example-newsletter' },
        mail: {
          publicationName: 'Example newsletter',
          confirmationUrl: 'https://example.test/confirm',
          unsubscribeUrl: 'https://example.test/unsubscribe',
        },
      },
    });
    await app.listen(0, '127.0.0.1');
    let backend = await app.getUrl();
    // Serve the production Angular bundle with a same-origin API proxy.
    const root = resolve('dist/examples/newsletter-angular-example/browser');
    server = createServer(async (request, response) => {
      try {
        const url = new URL(request.url ?? '/', 'http://localhost');
        response.setHeader('Referrer-Policy', 'no-referrer');
        response.setHeader('Cache-Control', 'no-store');
        if (url.pathname.startsWith('/api/')) {
          const chunks: Buffer[] = [];
          for await (const chunk of request) chunks.push(Buffer.from(chunk));
          const upstream = await originalFetch(`${backend}${url.pathname}`, {
            method: request.method,
            headers: { 'content-type': 'application/json' },
            ...(request.method === 'POST'
              ? { body: Buffer.concat(chunks) }
              : {}),
          });
          response.writeHead(upstream.status, {
            'content-type': 'application/json',
          });
          response.end(await upstream.text());
          return;
        }
        const filename = ['/', '/confirm', '/unsubscribe'].includes(
          url.pathname,
        )
          ? 'index.html'
          : url.pathname.slice(1);
        const file = resolve(root, filename);
        if (!file.startsWith(`${root}/`)) {
          response.writeHead(404).end();
          return;
        }
        response.setHeader(
          'content-type',
          (
            {
              '.html': 'text/html',
              '.js': 'text/javascript',
              '.css': 'text/css',
              '.ico': 'image/x-icon',
            } as Record<string, string>
          )[extname(file)] ?? 'application/octet-stream',
        );
        response.end(await readFile(file));
      } catch {
        response.writeHead(500).end();
      }
    });
    await new Promise<void>((done) => server?.listen(0, '127.0.0.1', done));
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const origin = `http://127.0.0.1:${address.port}`;
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const browserErrors: string[] = [];
    page.on('pageerror', (error) => browserErrors.push(error.message));
    await page.goto(origin);
    assert.equal(await page.getByRole('checkbox').isChecked(), false);
    await page
      .getByRole('textbox', { name: 'Email address' })
      .fill('Reader@Example.test');
    await page.getByRole('checkbox').check();
    const responsePromise = page.waitForResponse((r) =>
      r.url().endsWith('/api/newsletter/subscribe'),
    );
    await page.getByRole('button', { name: 'Request signup' }).click();
    const response = await responsePromise;
    assert.equal(response.status(), 202);
    assert.ok(
      Value.Check(
        NewsletterSubscriptionRequestSchema,
        response.request().postDataJSON(),
      ),
    );
    assert.ok(
      Value.Check(NewsletterSubscriptionResponseSchema, await response.json()),
    );
    await page
      .getByRole('status')
      .filter({ hasText: 'Request received' })
      .waitFor();
    const evidence = await source
      .getRepository(NewsletterConsentEntity)
      .findOneByOrFail({ email: 'reader@example.test', kind: 'granted' });
    assert.equal(evidence.consentVersion, exampleConsent.version);
    assert.equal(evidence.consentText, exampleConsent.text);
    assert.equal(evidence.source, 'example-signup');
    const subscribers = source.getRepository(NewsletterNativeSubscriberEntity);
    const status = async () =>
      (await subscribers.findOneByOrFail({ email: 'reader@example.test' }))
        .status;
    assert.equal(await status(), 'pending_confirmation');
    assert.equal(messages.length, 1);
    const links = messages[0].text?.match(/https:\/\/example\.test\/[^\s]+/g);
    assert.equal(links?.length, 2);
    for (const [index, expected] of ['active', 'unsubscribed'].entries()) {
      const link: URL = new URL(links![index]);
      const previous = await status();
      await page.goto(`${origin}${link.pathname}${link.search}`);
      await page.getByRole('button', { name: 'Continue' }).waitFor();
      assert.equal(
        await status(),
        previous,
        'Landing GET must not consume the token',
      );
      assert.equal(
        new URL(page.url()).search,
        '',
        'Remove token from browser address',
      );
      await page.getByRole('button', { name: 'Continue' }).click();
      await page
        .getByRole('status')
        .filter({ hasText: 'Request received' })
        .waitFor();
      assert.equal(await status(), expected);
      const replay: Response = await originalFetch(
        `${backend}/api/newsletter${link.pathname}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token: link.searchParams.get('token') }),
        },
      );
      assert.equal(replay.status, 202);
      assert.deepEqual(await replay.json(), { accepted: true });
    }
    assert.equal(
      await source
        .getRepository(NewsletterConsentEntity)
        .countBy({ email: 'reader@example.test', kind: 'withdrawn' }),
      1,
    );
    console.log(
      'PASS native: Forms → Angular client → Fastify → consent/database/mail → confirmation and withdrawal',
    );
    await app.close();

    const providerRequests: Record<string, unknown>[] = [];
    let providerStatus = 201;
    // Only the MailerLite adapter sees this fake; browser/backend HTTP uses originalFetch.
    globalThis.fetch = async (url, init) => {
      assert.equal(
        String(url),
        'https://connect.mailerlite.com/api/subscribers',
      );
      providerRequests.push(JSON.parse(String(init?.body)));
      return new Response(null, { status: providerStatus });
    };
    app = await createNewsletterApp({
      dataSource: source,
      subscriber: {
        mode: 'mailerlite',
        options: { apiKey: 'fixture-only', groupId: '123', maxAttempts: 1 },
      },
      webhook: { accountId: '123', webhookSecret: 'fixture-only-secret' },
      rateLimit: { mode: 'memory', limit: 3, windowMs: 60_000 },
    });
    await app.listen(0, '127.0.0.1');
    backend = await app.getUrl();
    const post = (path: string, body: unknown, headers = {}) =>
      originalFetch(`${backend}/api/newsletter/${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body: typeof body === 'string' ? body : JSON.stringify(body),
      });
    await page.goto(origin);
    await page
      .getByRole('textbox', { name: 'Email address' })
      .fill('external@example.test');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Request signup' }).click();
    await page
      .getByRole('status')
      .filter({ hasText: 'Request received' })
      .waitFor();
    assert.deepEqual(providerRequests, [
      {
        email: 'external@example.test',
        status: 'unconfirmed',
        resubscribe: false,
        groups: ['123'],
      },
    ]);
    assert.equal(
      await subscribers.countBy({ email: 'external@example.test' }),
      0,
    );
    assert.equal((await post('confirm', { token: 'invalid' })).status, 404);
    assert.equal(
      (await post('subscribe', { email: 'bad', consent: false })).status,
      400,
    );
    const payload = {
      email: 'outage@example.test',
      consent: true,
      consentVersion: exampleConsent.version,
    };
    providerStatus = 503;
    const unavailable = await post('subscribe', payload);
    assert.equal(unavailable.status, 503);
    assert.ok(!(await unavailable.text()).includes('fixture-only'));
    providerStatus = 201;
    assert.equal((await post('subscribe', payload)).status, 202);
    const limited = await post('subscribe', payload);
    assert.equal(limited.status, 429);
    assert.ok(limited.headers.get('retry-after'));
    const raw =
      JSON.stringify(
        {
          event: 'subscriber.unsubscribed',
          account_id: 123,
          id: '456',
          email: 'external@example.test',
          unsubscribed_at: '2026-10-06T12:00:00Z',
        },
        null,
        2,
      ) + '\n';
    const signature = createHmac('sha256', 'fixture-only-secret')
      .update(raw)
      .digest('hex');
    assert.equal(
      (await post('webhook', raw, { signature: 'invalid' })).status,
      401,
    );
    const first = await post('webhook', raw, { signature });
    assert.equal(first.status, 200);
    assert.deepEqual(await first.json(), { recorded: 1, duplicates: 0 });
    assert.deepEqual(await (await post('webhook', raw, { signature })).json(), {
      recorded: 0,
      duplicates: 1,
    });
    assert.equal(
      await source
        .getRepository(NewsletterConsentEntity)
        .countBy({ email: 'external@example.test', kind: 'withdrawn' }),
      1,
    );
    assert.deepEqual(browserErrors, []);
    console.log(
      'PASS MailerLite: browser signup, unconfirmed provider payload, failures/limits, signed raw-body webhook and deduplication',
    );
  } finally {
    globalThis.fetch = originalFetch;
    await browser?.close();
    if (server)
      await new Promise<void>((done, reject) =>
        server?.close((error) => (error ? reject(error) : done())),
      );
    await app?.close();
    if (source.isInitialized) await source.destroy();
    await container.stop();
  }
}
void run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
