import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { authenticator, cookie, requestHeaders } from './webauthn-fixture.mjs';

const invalid = (error) =>
  error.getStatus?.() >= 400 && error.getStatus?.() < 500;
const pgError = (code) => (error) =>
  (error.driverError?.code ?? error.code) === code;

/** Uses the real Nest service, published adapter, and PostgreSQL with synchronize disabled. */
export async function validatePasskeyPersistence({
  app,
  AuthPasskeyService,
  PasskeyEntity,
  userId,
  sessionCookie,
  restart,
}) {
  let source = app.get(DataSource);
  let service = app.get(AuthPasskeyService);
  const deviceOptions = { origin: 'http://localhost:3000', rpID: 'localhost' };
  const device = authenticator(deviceOptions);
  const repository = () => source.getRepository(PasskeyEntity);
  const load = (id) => repository().findOneByOrFail({ credentialID: id });
  const beginAuthentication = async () => {
    const result = await service.beginAuthentication({}, new Headers());
    return {
      challenge: result.body.challenge,
      headers: requestHeaders(cookie(result.headers)),
    };
  };
  // Exercise the package HTTP boundary, including challenge/session Set-Cookie forwarding.
  const post = async (path, payload, cookies = '') => {
    const result = await app.inject({
      method: 'POST',
      url: `/auth/passkeys/${path}`,
      payload,
      headers: { cookie: cookies },
    });
    assert.equal(result.statusCode, 200, result.body);
    const headers = new Headers();
    const values = result.headers['set-cookie'];
    for (const value of Array.isArray(values) ? values : values ? [values] : [])
      headers.append('set-cookie', value);
    return { body: result.json(), headers };
  };
  const enroll = async (authenticator, name) => {
    const begin = await post('registration/begin', {}, sessionCookie);
    const dto = authenticator.register(begin.body.challenge);
    if (name === null) delete dto.name;
    else dto.name = name;
    const result = await post(
      'registration/finish',
      dto,
      [sessionCookie, cookie(begin.headers)].join('; '),
    );
    assert.deepEqual(result.body, { success: true });
    return load(authenticator.id);
  };
  const authenticate = async (authenticator, counter) => {
    const begin = await post('authentication/begin', {});
    const result = await post(
      'authentication/finish',
      authenticator.authenticate(begin.body.challenge, counter),
      cookie(begin.headers),
    );
    assert.equal(result.body.user.id, userId);
    assert.ok(Array.isArray(result.body.rbac));
    const me = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { cookie: cookie(result.headers) },
    });
    assert.equal(me.statusCode, 200, me.body);
    assert.equal(me.json().user.id, userId);
    assert.equal((await load(authenticator.id)).counter, counter);
  };

  const anonymousEnrollment = await app.inject({
    method: 'POST',
    url: '/auth/passkeys/registration/begin',
    payload: {},
  });
  assert.equal(anonymousEnrollment.statusCode, 401, anonymousEnrollment.body);

  const stored = await enroll(device, 'Laptop passkey');
  assert.equal(stored.userId, userId);
  assert.equal(stored.name, 'Laptop passkey');
  assert.equal(stored.credentialID, device.id);
  assert.equal(stored.counter, 0);
  assert.equal(typeof stored.counter, 'number');
  assert.equal(stored.deviceType, 'singleDevice');
  assert.equal(stored.backedUp, false);
  assert.equal(stored.transports, 'internal');
  assert.equal(stored.aaguid, '00000000-0000-0000-0000-000000000000');
  assert.ok(stored.createdAt instanceof Date);
  assert.ok(Buffer.from(stored.publicKey, 'base64').length > 0);

  await authenticate(device, 1);
  const beginAcrossRestart = await beginAuthentication();
  app = await restart();
  source = app.get(DataSource);
  service = app.get(AuthPasskeyService);
  const result = await service.finishAuthentication(
    device.authenticate(beginAcrossRestart.challenge, 2),
    beginAcrossRestart.headers,
  );
  assert.equal(result.body.user.id, userId);
  assert.equal((await load(device.id)).counter, 2);
  assert.equal((await load(device.id)).publicKey, stored.publicKey);
  assert.equal((await load(device.id)).name, stored.name);
  await authenticate(device, 3);
  const stale = await beginAuthentication();
  await assert.rejects(
    service.finishAuthentication(
      device.authenticate(stale.challenge, 3),
      stale.headers,
    ),
    invalid,
  );
  assert.equal((await load(device.id)).counter, 3);

  // The signed challenge must be consumed atomically by the PostgreSQL adapter.
  const concurrent = await beginAuthentication();
  const attempts = await Promise.allSettled(
    [1, 2].map(() =>
      service.finishAuthentication(
        device.authenticate(concurrent.challenge, 4),
        concurrent.headers,
      ),
    ),
  );
  assert.equal(
    attempts.filter((attempt) => attempt.status === 'fulfilled').length,
    1,
  );
  assert.equal(
    attempts.filter((attempt) => attempt.status === 'rejected').length,
    1,
  );
  assert.equal((await load(device.id)).counter, 4);

  // Uniqueness is global across users, not merely per account.
  await assert.rejects(
    repository().save(repository().create({ ...stored, id: randomUUID() })),
    pgError('23505'),
  );
  const otherUserId = randomUUID();
  await source.query('INSERT INTO auth.users (id, email) VALUES ($1, $2)', [
    otherUserId,
    'duplicate-owner@example.test',
  ]);
  await assert.rejects(
    repository().save(
      repository().create({ ...stored, id: randomUUID(), userId: otherUserId }),
    ),
    pgError('23505'),
  );
  await assert.rejects(
    repository().save(
      repository().create({
        ...stored,
        id: randomUUID(),
        userId: randomUUID(),
        credentialID: 'b3JwaGFu',
      }),
    ),
    pgError('23503'),
  );

  const longCredential = authenticator({
    ...deviceOptions,
    credentialIdLength: 1023,
    registrationCounter: 2147483647,
  });
  const longStored = await enroll(longCredential, 'Long credential');
  assert.equal(longStored.credentialID.length, 1364);
  await authenticate(longCredential, 2147483648);
  await authenticate(longCredential, 4294967295);
  for (const counter of [-1, 4294967296]) {
    await assert.rejects(
      source.query('UPDATE auth.passkeys SET counter = $1 WHERE id = $2', [
        counter,
        longStored.id,
      ]),
      pgError('23514'),
    );
  }
  assert.equal((await load(longCredential.id)).counter, 4294967295);
  await assert.rejects(
    source.query('UPDATE auth.passkeys SET "credentialID" = $1 WHERE id = $2', [
      'x'.repeat(1365),
      longStored.id,
    ]),
    pgError('22001'),
  );

  const synced = authenticator({ ...deviceOptions, backedUp: true });
  const syncedStored = await enroll(synced, null);
  assert.equal(syncedStored.deviceType, 'multiDevice');
  assert.equal(syncedStored.backedUp, true);
  assert.equal(syncedStored.name, null);
  await authenticate(synced, 0);
  await authenticate(synced, 0);

  // Deleting a user cascades only that user's credentials.
  const disposable = await repository().save(
    repository().create({
      ...stored,
      id: randomUUID(),
      userId: otherUserId,
      credentialID: 'ZGlzcG9zYWJsZQ',
    }),
  );
  await source.query('DELETE FROM auth.users WHERE id = $1', [otherUserId]);
  assert.equal(await repository().findOneBy({ id: disposable.id }), null);
  assert.equal((await load(device.id)).userId, userId);
  console.log(
    'Passkey PostgreSQL enrollment, metadata, restart, counters, replay, uniqueness, and cascade checks passed.',
  );
}

/** Prove populated upgrades, atomic failure, and safe rollback independently of clean boot. */
export async function validatePasskeyStorageMigration(connection, migrations) {
  const {
    CreateAuthSchema1720200000000,
    CreateBetterAuthPasskeysTable1760200001000,
    ExpandPasskeyCredentialStorage1790899200000,
  } = migrations;
  const admin = new DataSource({
    type: 'postgres',
    ...connection,
    database: 'anarchitecture_auth',
  });
  await admin.initialize();
  try {
    await admin.query('CREATE DATABASE passkey_upgrade');
  } finally {
    await admin.destroy();
  }
  const baselineMigrations = [
    CreateAuthSchema1720200000000,
    CreateBetterAuthPasskeysTable1760200001000,
  ];
  const connect = async (migrations) => {
    const source = new DataSource({
      type: 'postgres',
      ...connection,
      database: 'passkey_upgrade',
      migrations,
      synchronize: false,
    });
    await source.initialize();
    return source;
  };
  const baseline = await connect(baselineMigrations);
  const userId = randomUUID();
  try {
    await baseline.runMigrations({ transaction: 'all' });
    await baseline.query('INSERT INTO auth.users (id, email) VALUES ($1, $2)', [
      userId,
      'legacy@example.test',
    ]);
    await baseline.query(
      `INSERT INTO auth.passkeys (id, name, "publicKey", "userId", "credentialID", counter, "deviceType", "backedUp", transports, aaguid)
      VALUES ('legacy', 'Legacy key', 'opaque-public-key', $1, 'bGVnYWN5', -1, 'singleDevice', false, 'usb', '00000000-0000-0000-0000-000000000000')`,
      [userId],
    );
  } finally {
    await baseline.destroy();
  }

  const source = await connect([
    ...baselineMigrations,
    ExpandPasskeyCredentialStorage1790899200000,
  ]);
  const columns = () =>
    source.query(`SELECT column_name, data_type, character_maximum_length FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'passkeys' AND column_name IN ('counter', 'credentialID') ORDER BY column_name`);
  const row = async () =>
    (
      await source.query('SELECT * FROM auth.passkeys WHERE id = $1', [
        'legacy',
      ])
    )[0];
  try {
    const beforeColumns = await columns();
    await assert.rejects(
      source.runMigrations({ transaction: 'all' }),
      pgError('23514'),
    );
    assert.deepEqual(
      await columns(),
      beforeColumns,
      'failed upgrade must leave original columns intact',
    );
    assert.equal((await row()).counter, -1);
    // Migration never silently repairs invalid data; the operator must decide how to resolve it.
    await source.query('UPDATE auth.passkeys SET counter = 9 WHERE id = $1', [
      'legacy',
    ]);
    const legacy = await row();
    const applied = await source.runMigrations({ transaction: 'all' });
    assert.equal(applied.length, 1);
    assert.deepEqual(
      { ...(await row()), counter: Number((await row()).counter) },
      legacy,
    );
    assert.deepEqual(await columns(), [
      {
        column_name: 'counter',
        data_type: 'bigint',
        character_maximum_length: null,
      },
      {
        column_name: 'credentialID',
        data_type: 'character varying',
        character_maximum_length: 1364,
      },
    ]);
    assert.equal((await source.runMigrations()).length, 0);

    // Rollback must refuse each incompatible field without truncation or counter reset.
    for (const [counter, credentialID] of [
      [2147483648, 'bGVnYWN5'],
      [9, 'x'.repeat(1364)],
    ]) {
      await source.query(
        'UPDATE auth.passkeys SET counter = $1, "credentialID" = $2 WHERE id = $3',
        [counter, credentialID, 'legacy'],
      );
      const before = await row();
      await assert.rejects(
        source.undoLastMigration({ transaction: 'all' }),
        /Cannot roll back passkey storage/,
      );
      assert.deepEqual(await row(), before);
    }
    await source.query(
      'UPDATE auth.passkeys SET counter = 9, "credentialID" = $1 WHERE id = $2',
      ['bGVnYWN5', 'legacy'],
    );
    await source.undoLastMigration({ transaction: 'all' });
    assert.deepEqual(await columns(), beforeColumns);
    assert.deepEqual(await row(), legacy);
    await source.runMigrations({ transaction: 'all' });
    const runner = source.createQueryRunner();
    try {
      const table = await runner.getTable('auth.passkeys');
      assert.ok(
        table.foreignKeys.some(
          (key) =>
            key.name === 'FK_auth_passkeys_userId' &&
            key.onDelete === 'CASCADE',
        ),
      );
      assert.ok(
        table.uniques.some(
          (key) => key.name === 'UQ_auth_passkeys_credentialID',
        ),
      );
      assert.ok(
        table.indices.some((key) => key.name === 'IDX_auth_passkeys_userId'),
      );
      assert.ok(
        table.checks.some(
          (key) => key.name === 'CHK_auth_passkeys_counter_uint32',
        ),
      );
    } finally {
      await runner.release();
    }
  } finally {
    await source.destroy();
  }
  console.log(
    'Passkey populated migration upgrade, failure atomicity, rollback guards, and reapply checks passed.',
  );
}
