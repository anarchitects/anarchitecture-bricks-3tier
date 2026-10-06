import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { setTimeout as delay } from 'node:timers/promises';
import { after, before, test } from 'node:test';
import { Client } from 'pg';
import { GenericContainer, Wait } from 'testcontainers';
import { DataSource } from 'typeorm';

const require = createRequire(import.meta.url);
const {
  NewsletterConsentEntity,
  TypeOrmConsentRepository,
  CreateNewsletterConsentEvents1791244800000,
} = require('../../../../dist/libs/newsletter/nest/src/infrastructure-persistence/index.js');

let container;
let first;
let second;
let repository;
let otherRepository;
const recordedAt = new Date('2026-10-06T12:34:56.789Z');
const grant = {
  kind: 'granted',
  email: 'reader@example.test',
  recordedAt,
  consentVersion: ' host/v1 ',
  consentText: ' Exact host wording.\nSecond line. ',
  source: '/articles?source=newsletter',
  ipAddress: '2001:db8::1',
};
function withdrawal(dedupeKey, overrides = {}) {
  return {
    kind: 'withdrawn',
    email: 'reader@example.test',
    recordedAt,
    eventSource: 'provider/account-A',
    dedupeKey,
    ...overrides,
  };
}

before(
  async () => {
    container = await new GenericContainer('postgres:16-alpine')
      .withEnvironment({
        POSTGRES_DB: 'newsletter_test',
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
      database: 'newsletter_test',
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
      entities: [NewsletterConsentEntity],
      migrations: [CreateNewsletterConsentEvents1791244800000],
      migrationsTableName: 'newsletter_migrations',
      synchronize: false,
    };
    first = await new DataSource(options).initialize();
    assert.equal((await first.runMigrations({ transaction: 'all' })).length, 1);
    second = await new DataSource(options).initialize();
    repository = new TypeOrmConsentRepository(first);
    otherRepository = new TypeOrmConsentRepository(second);
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
    await container?.stop();
  }
});

test('migration is tracked and matches entity metadata without synchronization', async () => {
  assert.deepEqual(await first.runMigrations(), []);
  const changes = await first.driver.createSchemaBuilder().log();
  assert.deepEqual(
    changes.upQueries.map((query) => query.query),
    [],
  );
  assert.equal(first.getMetadata(NewsletterConsentEntity).relations.length, 0);
});

test('grants preserve exact evidence and retries append distinct immutable history', async () => {
  await repository.appendGrant(grant);
  await repository.appendGrant(grant);
  await repository.appendGrant({
    ...grant,
    email: 'minimal@example.test',
    source: undefined,
    ipAddress: undefined,
  });
  const rows = await first
    .getRepository(NewsletterConsentEntity)
    .findBy({ kind: 'granted', email: grant.email });
  assert.equal(rows.length, 2);
  assert.notEqual(rows[0].id, rows[1].id);
  for (const row of rows) {
    assert.deepEqual(
      { ...row, id: undefined },
      { ...grant, id: undefined, eventSource: null, dedupeKey: null },
    );
  }
  const minimal = await first
    .getRepository(NewsletterConsentEntity)
    .findOneByOrFail({ email: 'minimal@example.test' });
  assert.equal(minimal.source, null);
  assert.equal(minimal.ipAddress, null);
  const snapshot = rows.map((row) => ({ ...row }));
  await repository.appendWithdrawalOnce(withdrawal('withdraw-after-grant'));
  const afterWithdrawal = await first
    .getRepository(NewsletterConsentEntity)
    .findBy({ kind: 'granted', email: grant.email });
  const byId = (left, right) => left.id.localeCompare(right.id);
  assert.deepEqual(
    afterWithdrawal.map((row) => ({ ...row })).sort(byId),
    snapshot.sort(byId),
  );
});

test('withdrawal without a grant is auditable and never invents consent wording', async () => {
  assert.equal(
    await repository.appendWithdrawalOnce(
      withdrawal('unknown', { email: 'unknown@example.test' }),
    ),
    'recorded',
  );
  const row = await first
    .getRepository(NewsletterConsentEntity)
    .findOneByOrFail({ dedupeKey: 'unknown' });
  assert.deepEqual(
    { ...row, id: undefined },
    {
      ...withdrawal('unknown', { email: 'unknown@example.test' }),
      id: undefined,
      consentVersion: null,
      consentText: null,
      source: null,
      ipAddress: null,
    },
  );
});

test('concurrent delivery across independent connections commits one event', async () => {
  const event = withdrawal('concurrent');
  const results = await Promise.all(
    Array.from({ length: 24 }, (_, index) =>
      (index % 2 ? repository : otherRepository).appendWithdrawalOnce(event),
    ),
  );
  assert.equal(results.filter((result) => result === 'recorded').length, 1);
  assert.equal(results.filter((result) => result === 'duplicate').length, 23);
  const rows = await first
    .getRepository(NewsletterConsentEntity)
    .findBy({ dedupeKey: event.dedupeKey });
  assert.equal(rows.length, 1);
  assert.equal(
    await otherRepository.appendWithdrawalOnce({
      ...event,
      email: 'changed@example.test',
      recordedAt: new Date(),
    }),
    'duplicate',
  );
  assert.deepEqual(
    await first
      .getRepository(NewsletterConsentEntity)
      .findBy({ dedupeKey: event.dedupeKey }),
    rows,
  );
});

test('deduplication is durable after reconnect and preserves opaque account/event identity', async () => {
  await second.destroy();
  await second.initialize();
  otherRepository = new TypeOrmConsentRepository(second);
  assert.equal(
    await otherRepository.appendWithdrawalOnce(withdrawal('concurrent')),
    'duplicate',
  );
  for (const event of [
    withdrawal('concurrent', { eventSource: 'provider/account-B' }),
    withdrawal('Concurrent'),
    withdrawal(' concurrent '),
  ])
    assert.equal(await otherRepository.appendWithdrawalOnce(event), 'recorded');
});

test('unrelated uniqueness errors propagate rather than becoming duplicates', async () => {
  await first.query(
    'CREATE UNIQUE INDEX "test_unrelated_email" ON "newsletter"."consent_events" ("email") WHERE "email" = \'unique@example.test\'',
  );
  try {
    await repository.appendWithdrawalOnce(
      withdrawal('unique-1', { email: 'unique@example.test' }),
    );
    await assert.rejects(
      repository.appendWithdrawalOnce(
        withdrawal('unique-2', { email: 'unique@example.test' }),
      ),
      (error) =>
        error.driverError.code === '23505' &&
        error.driverError.constraint === 'test_unrelated_email',
    );
    assert.equal(
      await first
        .getRepository(NewsletterConsentEntity)
        .countBy({ dedupeKey: 'unique-2' }),
      0,
    );
  } finally {
    await first.query('DROP INDEX "newsletter"."test_unrelated_email"');
  }
  assert.equal(
    await repository.appendWithdrawalOnce(
      withdrawal('unique-2', { email: 'unique@example.test' }),
    ),
    'recorded',
  );
});

test('a failed batch can retry committed events and then record its remainder', async () => {
  const events = ['batch-1', 'batch-2', 'batch-3'].map((key) =>
    withdrawal(key),
  );
  await first.query(
    'ALTER TABLE "newsletter"."consent_events" ADD CONSTRAINT "test_storage_failure" CHECK ("dedupe_key" IS DISTINCT FROM \'batch-2\')',
  );
  try {
    await assert.rejects(
      (async () => {
        for (const event of events)
          await repository.appendWithdrawalOnce(event);
      })(),
      (error) => error.driverError.code === '23514',
    );
    assert.equal(
      await first
        .getRepository(NewsletterConsentEntity)
        .countBy({ dedupeKey: 'batch-1' }),
      1,
    );
    assert.equal(
      await first
        .getRepository(NewsletterConsentEntity)
        .countBy({ dedupeKey: 'batch-2' }),
      0,
    );
    assert.equal(
      await first
        .getRepository(NewsletterConsentEntity)
        .countBy({ dedupeKey: 'batch-3' }),
      0,
    );
  } finally {
    await first.query(
      'ALTER TABLE "newsletter"."consent_events" DROP CONSTRAINT "test_storage_failure"',
    );
  }
  const outcomes = [];
  for (const event of events)
    outcomes.push(await repository.appendWithdrawalOnce(event));
  assert.deepEqual(outcomes, ['duplicate', 'recorded', 'recorded']);
});

test('database shape constraints reject missing identity, invented wording and unknown kinds', async () => {
  const rows = [
    { kind: 'granted', consentVersion: null, consentText: null },
    {
      kind: 'granted',
      consentVersion: 'v1',
      consentText: 'wording',
      eventSource: 'source',
      dedupeKey: 'key',
    },
    { kind: 'withdrawn', eventSource: null, dedupeKey: 'key' },
    { kind: 'withdrawn', eventSource: 'source', dedupeKey: null },
    { kind: 'withdrawn', eventSource: ' ', dedupeKey: 'key' },
    {
      kind: 'withdrawn',
      eventSource: 'source',
      dedupeKey: 'key',
      consentText: 'invented',
    },
    { kind: 'unknown' },
  ];
  for (const row of rows) {
    await assert.rejects(
      first
        .getRepository(NewsletterConsentEntity)
        .insert({ id: randomUUID(), email: grant.email, recordedAt, ...row }),
      (error) =>
        error.driverError.code === '23514' &&
        error.driverError.constraint === 'ck_newsletter_consent_event_shape',
    );
  }
  await assert.rejects(
    repository.appendWithdrawalOnce(
      withdrawal('missing-time', { recordedAt: null }),
    ),
    (error) => error.driverError.code === '23502',
  );
});

test('migration rollback removes only its table, and reapplication restores the schema', async () => {
  await first.query(
    'CREATE TABLE "newsletter"."host_owned" (id integer PRIMARY KEY)',
  );
  await first.undoLastMigration({ transaction: 'all' });
  assert.deepEqual(
    await first.query(
      "SELECT to_regclass('newsletter.consent_events') AS name",
    ),
    [{ name: null }],
  );
  assert.deepEqual(
    await first.query("SELECT to_regclass('newsletter.host_owned') AS name"),
    [{ name: 'newsletter.host_owned' }],
  );
  assert.equal((await first.runMigrations({ transaction: 'all' })).length, 1);
  await repository.appendGrant(grant);
  assert.equal(await first.getRepository(NewsletterConsentEntity).count(), 1);
});
