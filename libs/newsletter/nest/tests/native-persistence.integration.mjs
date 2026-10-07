import 'reflect-metadata';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { before, after, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { GenericContainer, Wait } from 'testcontainers';
import { DataSource } from 'typeorm';
import { Client } from 'pg';

// Consume built packages in isolation, just like the existing package-smoke test.
// This integrated Nx repository has no Yarn package workspaces to resolve dist imports.
const fixture = mkdtempSync(path.join(tmpdir(), 'newsletter-native-contract-'));
mkdirSync(path.join(fixture, 'node_modules/@anarchitects'), {
  recursive: true,
});
for (const layer of ['nest', 'ts'])
  cpSync(
    path.resolve('dist/libs/newsletter', layer),
    path.join(fixture, 'node_modules/@anarchitects', `newsletter-${layer}`),
    { recursive: true },
  );
for (const name of ['@sinclair', 'tslib', 'typeorm'])
  symlinkSync(
    path.resolve('node_modules', name),
    path.join(fixture, 'node_modules', name),
    'junction',
  );
const require = createRequire(path.join(fixture, 'consumer.cjs'));
const persistence = require('@anarchitects/newsletter-nest/infrastructure-persistence');
const {
  NewsletterNativeLifecycleService,
  NewsletterSubscriptionService,
  NewsletterUnavailableError,
} = require('@anarchitects/newsletter-nest/application');
const {
  CryptoNativeToken,
  NativeSubscriberAdapter,
  NewsletterNativeMailService,
  NativeUnsubscribeService,
} = require('@anarchitects/newsletter-nest/infrastructure-native');
const {
  NewsletterNativeSubscriberEntity: Subscriber,
  NewsletterNativeTokenEntity: Token,
  NewsletterConsentEntity: Consent,
  TypeOrmNativeSubscriberRepository: Repository,
  TypeOrmConsentRepository,
  CreateNewsletterConsentEvents1791244800000,
  CreateNewsletterNativeSubscribers1791288000000,
} = persistence;
let container, first, second;
const crypto = new CryptoNativeToken();
let now = Date.parse('2026-10-06T12:00:00Z');
const clock = () => new Date(now);
function service(scope, source = first, overrides = {}) {
  return new NewsletterNativeLifecycleService(
    new Repository(source),
    crypto,
    {
      scope,
      confirmationTtlMs: 10_000,
      unsubscribeTtlMs: 30_000,
      resendCooldownMs: 1000,
      ...overrides,
    },
    clock,
  );
}
async function read(scope, email = 'reader@example.test') {
  return first.getRepository(Subscriber).findOneByOrFail({ scope, email });
}
function requirePreparation(value) {
  assert.ok(value);
  return value;
}

before(
  async () => {
    container = await new GenericContainer('postgres:16-alpine')
      .withEnvironment({
        POSTGRES_DB: 'newsletter_native',
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'postgres',
      })
      .withExposedPorts(5432)
      .withWaitStrategy(Wait.forListeningPorts())
      .start();
    const connection = {
      host: container.getHost(),
      port: container.getMappedPort(5432),
      user: 'postgres',
      password: 'postgres',
      database: 'newsletter_native',
    };
    for (let attempt = 0; ; attempt++) {
      const client = new Client(connection);
      try {
        await client.connect();
        await client.query('SELECT 1');
        break;
      } catch (error) {
        if (attempt === 29) throw error;
        await delay(250);
      } finally {
        await client.end().catch(() => undefined);
      }
    }
    const options = {
      type: 'postgres',
      host: connection.host,
      port: connection.port,
      username: connection.user,
      password: connection.password,
      database: connection.database,
      entities: [Consent, Subscriber, Token],
      migrations: [
        CreateNewsletterConsentEvents1791244800000,
        CreateNewsletterNativeSubscribers1791288000000,
      ],
      synchronize: false,
    };
    first = await new DataSource(options).initialize();
    assert.equal((await first.runMigrations({ transaction: 'all' })).length, 2);
    second = await new DataSource(options).initialize();
  },
  { timeout: 120_000 },
);
after(async () => {
  try {
    await Promise.all(
      [first, second]
        .filter((source) => source?.isInitialized)
        .map((source) => source.destroy()),
    );
  } finally {
    try {
      await container?.stop();
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  }
});

test('migration matches metadata and operational tables are distinct from consent evidence', async () => {
  assert.deepEqual(await first.runMigrations(), []);
  const changes = await first.driver.createSchemaBuilder().log();
  assert.deepEqual(
    changes.upQueries.map((q) => q.query),
    [],
  );
  assert.equal(first.getMetadata(Subscriber).relations.length, 0);
  assert.equal(
    first.getMetadata(Token).relations[0].inverseEntityMetadata.tableName,
    'native_subscribers',
  );
});

test('canonical identity, separate scopes and hashed token persistence', async () => {
  const lifecycle = service('identity');
  const prepared = requirePreparation(
    await lifecycle.prepareSubscription({ email: 'Reader@Example.Test' }),
  );
  const subscriber = await read('identity');
  assert.equal(subscriber.status, 'pending_confirmation');
  const rows = await first
    .getRepository(Token)
    .findBy({ subscriberId: subscriber.id });
  assert.equal(rows.length, 2);
  assert.ok(
    rows.every(
      (row) =>
        row.generation === subscriber.generation && row.consumedAt === null,
    ),
  );
  assert.ok(!JSON.stringify(rows).includes(prepared.confirmationToken));
  assert.ok(!JSON.stringify(rows).includes(prepared.unsubscribeToken));
  assert.equal(
    rows.find((row) => row.purpose === 'confirm').hash,
    crypto.hash(prepared.confirmationToken, 'confirm'),
  );
  assert.equal(await first.getRepository(Consent).count(), 0);
  await service('other-scope').prepareSubscription({
    email: 'reader@example.test',
  });
  assert.notEqual((await read('other-scope')).id, subscriber.id);
  await service('other-scope').confirm(prepared.confirmationToken);
  assert.equal((await read('other-scope')).status, 'pending_confirmation');
});

test('concurrent subscribe is unique across connections and cooldown bounds token rotation', async () => {
  const primary = service('concurrent');
  const secondary = service('concurrent', second);
  const results = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      (i % 2 ? primary : secondary).prepareSubscription({
        email: 'reader@example.test',
      }),
    ),
  );
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(
    await first.getRepository(Subscriber).countBy({ scope: 'concurrent' }),
    1,
  );
  const original = requirePreparation(results.find(Boolean));
  const originalState = await read('concurrent');
  now += 1000;
  const rotated = requirePreparation(
    await primary.prepareSubscription({ email: 'reader@example.test' }),
  );
  assert.notEqual(rotated.confirmationToken, original.confirmationToken);
  assert.equal((await read('concurrent')).generation, originalState.generation);
  assert.equal(
    await first
      .getRepository(Token)
      .countBy({ subscriberId: originalState.id }),
    2,
  );
  await primary.confirm(original.confirmationToken);
  await primary.unsubscribe(original.unsubscribeToken);
  assert.equal((await read('concurrent')).status, 'pending_confirmation');
  await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      (i % 2 ? primary : secondary).confirm(rotated.confirmationToken),
    ),
  );
  assert.equal((await read('concurrent')).status, 'active');
  assert.ok(
    (
      await first.getRepository(Token).findOneByOrFail({
        hash: crypto.hash(rotated.confirmationToken, 'confirm'),
      })
    ).consumedAt,
  );
  const active = await read('concurrent');
  assert.equal(
    await primary.prepareSubscription({ email: active.email }),
    undefined,
  );
  await primary.confirm(rotated.confirmationToken);
  assert.deepEqual(await read('concurrent'), active);
});

test('expiry at the exact boundary, wrong purpose, malformed and unknown tokens do not mutate state', async () => {
  const lifecycle = service('expiry');
  const prepared = requirePreparation(
    await lifecycle.prepareSubscription({ email: 'reader@example.test' }),
  );
  const before = await read('expiry');
  await lifecycle.confirm(prepared.unsubscribeToken);
  await lifecycle.unsubscribe(prepared.confirmationToken);
  await lifecycle.confirm('invalid');
  await lifecycle.confirm(crypto.issue('confirm').secret);
  now += 10_000;
  await lifecycle.confirm(prepared.confirmationToken);
  assert.deepEqual(await read('expiry'), before);
  now += 20_000;
  await lifecycle.unsubscribe(prepared.unsubscribeToken);
  assert.deepEqual(await read('expiry'), before);
  const fresh = requirePreparation(
    await lifecycle.prepareSubscription({ email: 'reader@example.test' }),
  );
  await lifecycle.confirm(fresh.confirmationToken);
  assert.equal((await read('expiry')).status, 'active');
});

test('unsubscribe races with confirmation, appends once and cannot be reversed by replay', async () => {
  const primary = service('race');
  const secondary = service('race', second);
  const prepared = requirePreparation(
    await primary.prepareSubscription({ email: 'reader@example.test' }),
  );
  const identity = await read('race');
  await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      i % 2
        ? primary.confirm(prepared.confirmationToken)
        : secondary.unsubscribe(prepared.unsubscribeToken),
    ),
  );
  assert.equal((await read('race')).status, 'unsubscribed');
  await primary.confirm(prepared.confirmationToken);
  await secondary.unsubscribe(prepared.unsubscribeToken);
  assert.equal((await read('race')).status, 'unsubscribed');
  const evidence = await first
    .getRepository(Consent)
    .findBy({ eventSource: 'native:race' });
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].dedupeKey, `${identity.id}:${identity.generation}`);
  assert.equal(evidence[0].consentVersion, null);
  assert.equal(evidence[0].consentText, null);
  await second.destroy();
  await second.initialize();
  await service('race', second).unsubscribe(prepared.unsubscribeToken);
  assert.equal(
    await first.getRepository(Consent).countBy({ eventSource: 'native:race' }),
    1,
  );
});

test('resubscription needs a fresh generation/confirmation and preserves append-only history', async () => {
  const lifecycle = service('resubscribe');
  const history = new TypeOrmConsentRepository(first);
  // Use the real subscription use case to establish fresh consent-before-native ordering.
  let preparation;
  const subscriber = {
    subscribe: async (request) => {
      preparation = await lifecycle.prepareSubscription(request);
    },
  };
  const application = new NewsletterSubscriptionService(
    history,
    subscriber,
    { version: 'v1', text: 'Host wording' },
    clock,
  );
  const request = {
    email: 'resub@example.test',
    consent: true,
    consentVersion: 'v1',
  };
  await application.subscribe(request);
  const old = requirePreparation(preparation);
  const initial = await read('resubscribe', request.email);
  await lifecycle.confirm(old.confirmationToken);
  await lifecycle.unsubscribe(old.unsubscribeToken);
  const before = await first
    .getRepository(Consent)
    .findBy({ email: request.email });
  await assert.rejects(application.subscribe({ ...request, consent: false }));
  assert.equal(
    (await read('resubscribe', request.email)).status,
    'unsubscribed',
  );
  await application.subscribe(request);
  const fresh = requirePreparation(preparation);
  const pending = await read('resubscribe', request.email);
  assert.equal(pending.id, initial.id);
  assert.notEqual(pending.generation, initial.generation);
  assert.equal(pending.status, 'pending_confirmation');
  await lifecycle.confirm(old.confirmationToken);
  await lifecycle.unsubscribe(old.unsubscribeToken);
  assert.deepEqual(await read('resubscribe', request.email), pending);
  await lifecycle.confirm(fresh.confirmationToken);
  assert.equal((await read('resubscribe', request.email)).status, 'active');
  const after = await first
    .getRepository(Consent)
    .findBy({ email: request.email });
  assert.equal(after.filter((row) => row.kind === 'granted').length, 2);
  for (const row of before)
    assert.deepEqual(
      after.find((candidate) => candidate.id === row.id),
      row,
    );
});

test('withdrawal evidence failure rolls back status and consumption, allowing the same token to retry', async () => {
  const lifecycle = service('rollback');
  const prepared = requirePreparation(
    await lifecycle.prepareSubscription({ email: 'reader@example.test' }),
  );
  await lifecycle.confirm(prepared.confirmationToken);
  await first.query(
    `ALTER TABLE newsletter.consent_events ADD CONSTRAINT test_native_failure CHECK (event_source IS DISTINCT FROM 'native:rollback')`,
  );
  try {
    await assert.rejects(
      lifecycle.unsubscribe(prepared.unsubscribeToken),
      (error) =>
        error instanceof NewsletterUnavailableError &&
        !error.message.includes('test_native_failure'),
    );
    assert.equal((await read('rollback')).status, 'active');
    assert.equal(
      (
        await first.getRepository(Token).findOneByOrFail({
          hash: crypto.hash(prepared.unsubscribeToken, 'unsubscribe'),
        })
      ).consumedAt,
      null,
    );
  } finally {
    await first.query(
      'ALTER TABLE newsletter.consent_events DROP CONSTRAINT test_native_failure',
    );
  }
  await lifecycle.unsubscribe(prepared.unsubscribeToken);
  assert.equal((await read('rollback')).status, 'unsubscribed');
  assert.equal(
    await first
      .getRepository(Consent)
      .countBy({ eventSource: 'native:rollback' }),
    1,
  );
});

test('token insert failure rolls back creation, and consent failure prevents subscriber invocation', async () => {
  const retry = service('failed-rotation');
  const original = requirePreparation(
    await retry.prepareSubscription({ email: 'reader@example.test' }),
  );
  const originalState = await read('failed-rotation');
  const originalTokens = await first
    .getRepository(Token)
    .findBy({ subscriberId: originalState.id });
  now += 1000;
  await first.query(
    `ALTER TABLE newsletter.native_tokens ADD CONSTRAINT test_token_failure CHECK (purpose <> 'unsubscribe') NOT VALID`,
  );
  try {
    await assert.rejects(
      service('token-failure').prepareSubscription({
        email: 'reader@example.test',
      }),
      NewsletterUnavailableError,
    );
    assert.equal(
      await first.getRepository(Subscriber).countBy({ scope: 'token-failure' }),
      0,
    );
    await assert.rejects(
      retry.prepareSubscription({ email: 'reader@example.test' }),
      NewsletterUnavailableError,
    );
    assert.deepEqual(await read('failed-rotation'), originalState);
    assert.deepEqual(
      await first
        .getRepository(Token)
        .findBy({ subscriberId: originalState.id }),
      originalTokens,
    );
  } finally {
    await first.query(
      'ALTER TABLE newsletter.native_tokens DROP CONSTRAINT test_token_failure',
    );
  }
  await retry.confirm(original.confirmationToken);
  assert.equal((await read('failed-rotation')).status, 'active');
  const adapter = new NativeSubscriberAdapter(service('adapter'), {
    sendConfirmation: async () => undefined,
    sendUnsubscribed: async () => undefined,
  });
  const failingConsent = {
    appendGrant: async () => {
      throw new Error('offline');
    },
    appendWithdrawalOnce: async () => {
      throw new Error('unexpected');
    },
  };
  const application = new NewsletterSubscriptionService(
    failingConsent,
    adapter,
    { version: 'v1', text: 'Host wording' },
  );
  await assert.rejects(
    application.subscribe({
      email: 'reader@example.test',
      consent: true,
      consentVersion: 'v1',
    }),
  );
  assert.equal(
    await first.getRepository(Subscriber).countBy({ scope: 'adapter' }),
    0,
  );
  assert.equal(
    await adapter.subscribe({ email: 'reader@example.test' }),
    undefined,
  );
  assert.equal((await read('adapter')).status, 'pending_confirmation');
});

test('native mail failure, cooldown, rotation and receipt replay preserve real committed state', async () => {
  const scope = 'mail-flow';
  const email = 'mail-flow@example.test';
  const lifecycle = service(scope);
  const messages = [];
  const outcomes = [];
  const snapshots = [];
  let fail = true;
  const mail = new NewsletterNativeMailService(
    {
      sendMessage: async (message) => {
        // Query through a second connection: pending state and consent are already committed.
        const state = await second
          .getRepository(Subscriber)
          .findOneByOrFail({ scope, email });
        snapshots.push({
          status: state.status,
          grants: await second
            .getRepository(Consent)
            .countBy({ email, kind: 'granted' }),
        });
        messages.push(message);
        if (fail) throw new Error('SMTP details must stay private');
      },
      send: async () => {
        throw new Error('legacy send is forbidden');
      },
      sendTemplate: async () => {
        throw new Error('legacy templates are forbidden');
      },
    },
    {
      publicationName: 'Host news',
      confirmationUrl: 'https://host.example.test/confirm',
      unsubscribeUrl: 'https://host.example.test/unsubscribe',
      maxAttempts: 2,
      retryDelayMs: 0,
      onDeliveryOutcome: (outcome) => outcomes.push(outcome),
    },
  );
  const subscriptions = new NewsletterSubscriptionService(
    new TypeOrmConsentRepository(first),
    new NativeSubscriberAdapter(lifecycle, mail),
    { version: 'v1', text: 'Host wording' },
    clock,
  );
  const request = { email, consent: true, consentVersion: 'v1' };
  assert.deepEqual(await subscriptions.subscribe(request), { accepted: true });
  assert.equal((await read(scope, email)).status, 'pending_confirmation');
  assert.equal(messages.length, 2);
  assert.equal(messages[0], messages[1]);
  assert.deepEqual(outcomes, [
    { kind: 'confirmation', outcome: 'failed', attempts: 2 },
  ]);
  const parseLinks = (message) =>
    message.text
      .match(/https:\/\/\S+/g)
      .map((link) => new URL(link).searchParams.get('token'));
  const old = parseLinks(messages[0]);
  await subscriptions.subscribe(request);
  assert.equal(messages.length, 2); // Failed delivery does not bypass the resend cooldown.
  now += 1000;
  fail = false;
  await subscriptions.subscribe(request);
  assert.equal(messages.length, 3);
  const fresh = parseLinks(messages[2]);
  assert.notEqual(fresh[0], old[0]);
  await lifecycle.confirm(old[0]);
  assert.equal((await read(scope, email)).status, 'pending_confirmation');
  await lifecycle.confirm(fresh[0]);
  await subscriptions.subscribe(request);
  assert.equal(messages.length, 3); // Active membership has the same accepted response, no mail.
  const withdrawal = new NativeUnsubscribeService(lifecycle, mail);
  fail = true;
  await Promise.all(
    Array.from({ length: 12 }, () => withdrawal.unsubscribe(fresh[1])),
  );
  assert.equal((await read(scope, email)).status, 'unsubscribed');
  assert.equal(
    await first
      .getRepository(Consent)
      .countBy({ eventSource: 'native:' + scope }),
    1,
  );
  assert.equal(messages.length, 5); // Only one receipt operation, with two bounded attempts.
  await withdrawal.unsubscribe(fresh[1]);
  await withdrawal.unsubscribe(old[1]);
  await withdrawal.unsubscribe('invalid');
  assert.equal(messages.length, 5);
  assert.deepEqual(outcomes.at(-1), {
    kind: 'unsubscribed',
    outcome: 'failed',
    attempts: 2,
  });
  assert.equal(
    await first.getRepository(Consent).countBy({ email, kind: 'granted' }),
    4,
  );
  assert.deepEqual(
    snapshots.map((value) => value.status),
    [
      'pending_confirmation',
      'pending_confirmation',
      'pending_confirmation',
      'unsubscribed',
      'unsubscribed',
    ],
  );
  assert.ok(snapshots.every((value) => value.grants > 0));
  fail = false;
  const previousGeneration = (await read(scope, email)).generation;
  await subscriptions.subscribe(request);
  assert.equal(messages.length, 6);
  assert.notEqual((await read(scope, email)).generation, previousGeneration);
  assert.equal((await read(scope, email)).status, 'pending_confirmation');
  await withdrawal.unsubscribe(fresh[1]);
  assert.equal(messages.length, 6);
  const latest = parseLinks(messages[5]);
  await lifecycle.confirm(latest[0]);
  assert.equal((await read(scope, email)).status, 'active');
});

test('native migration rollback preserves consent and host objects, and reapplication restores matching metadata', async () => {
  const count = await first.getRepository(Consent).count();
  await first.query(
    'CREATE TABLE newsletter.host_owned (id integer PRIMARY KEY)',
  );
  await first.undoLastMigration({ transaction: 'all' });
  assert.deepEqual(
    await first.query(
      "SELECT to_regclass('newsletter.native_subscribers') AS name",
    ),
    [{ name: null }],
  );
  assert.deepEqual(
    await first.query("SELECT to_regclass('newsletter.host_owned') AS name"),
    [{ name: 'newsletter.host_owned' }],
  );
  assert.equal(await first.getRepository(Consent).count(), count);
  await first.query('DROP TABLE newsletter.host_owned');
  assert.equal((await first.runMigrations({ transaction: 'all' })).length, 1);
  assert.deepEqual(
    (await first.driver.createSchemaBuilder().log()).upQueries,
    [],
  );
});
