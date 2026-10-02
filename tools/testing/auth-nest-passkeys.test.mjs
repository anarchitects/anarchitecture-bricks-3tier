import assert from 'node:assert/strict';
import {
  createHash,
  generateKeyPairSync,
  randomBytes,
  sign,
} from 'node:crypto';
import { mkdtemp, mkdir, symlink, rm } from 'node:fs/promises';
import Module, { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { memoryAdapter } from 'better-auth/adapters/memory';

// Exercise the shipped CommonJS adapter against the real ESM Better Auth and
// SimpleWebAuthn runtime. Only persistence and the physical authenticator are test doubles.
const root = fileURLToPath(new URL('../../', import.meta.url));
const temporary = await mkdtemp(path.join(tmpdir(), 'auth-passkeys-'));
const scope = path.join(temporary, 'node_modules', '@anarchitects');
await mkdir(scope, { recursive: true });
for (const [name, folder] of [
  ['auth-ts', 'auth/ts'],
  ['auth-declarations', 'auth/declarations'],
  ['common-nest-mailer', 'common/nest/mailer'],
]) {
  await symlink(
    path.join(root, 'dist/libs', folder),
    path.join(scope, name),
    'junction',
  );
}
process.env.NODE_PATH = [
  path.join(temporary, 'node_modules'),
  process.env.NODE_PATH,
]
  .filter(Boolean)
  .join(path.delimiter);
Module._initPaths();
after(() => rm(temporary, { recursive: true, force: true }));
const require = createRequire(import.meta.url);
const built = path.join(root, 'dist/libs/auth/nest/src');
const { BetterAuthAuthEngineAdapter } = require(
  path.join(
    built,
    'infrastructure-engine/better-auth/better-auth-auth-engine.adapter.js',
  ),
);
const { resolveAuthApplicationModuleOptions } = require(
  path.join(built, 'config'),
);
const { AuthPasskeyService } = require(path.join(built, 'application'));
const origin = 'https://login.example.test';
const rpID = 'example.test';

const hash = (data) => createHash('sha256').update(data).digest();
const encode = (data) => Buffer.from(data).toString('base64url');
const cookie = (headers) =>
  headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
const requestHeaders = (...cookies) =>
  new Headers({ cookie: cookies.filter(Boolean).join('; ') });
const count = (db, model) => db[model]?.length ?? 0;
const invalid = (error) =>
  error.getStatus?.() >= 400 && error.getStatus?.() < 500;

// Minimal CBOR encoder for this test's ES256/none attestation fixtures.
function cbor(value) {
  const head = (major, size) =>
    size < 24
      ? Buffer.from([(major << 5) | size])
      : size < 256
        ? Buffer.from([(major << 5) | 24, size])
        : Buffer.from([(major << 5) | 25, size >> 8, size & 255]);
  if (typeof value === 'number')
    return head(value < 0 ? 1 : 0, value < 0 ? -1 - value : value);
  if (typeof value === 'string')
    return Buffer.concat([
      head(3, Buffer.byteLength(value)),
      Buffer.from(value),
    ]);
  if (Buffer.isBuffer(value))
    return Buffer.concat([head(2, value.length), value]);
  if (value instanceof Map)
    return Buffer.concat([
      head(5, value.size),
      ...[...value].flatMap(([key, item]) => [cbor(key), cbor(item)]),
    ]);
  throw new Error('Unsupported fixture CBOR value');
}

function authenticator() {
  const { publicKey, privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
  });
  const jwk = publicKey.export({ format: 'jwk' });
  const credentialID = randomBytes(32);
  const id = encode(credentialID);
  const key = cbor(
    new Map([
      [1, 2],
      [3, -7],
      [-1, 1],
      [-2, Buffer.from(jwk.x, 'base64url')],
      [-3, Buffer.from(jwk.y, 'base64url')],
    ]),
  );
  const authData = (counter, registering, relyingParty = rpID) => {
    const countBytes = Buffer.alloc(4);
    countBytes.writeUInt32BE(counter);
    return Buffer.concat([
      hash(relyingParty),
      Buffer.from([registering ? 0x45 : 0x05]),
      countBytes,
      ...(registering
        ? [
            Buffer.alloc(16),
            Buffer.from([0, credentialID.length]),
            credentialID,
            key,
          ]
        : []),
    ]);
  };
  const clientData = (type, challenge, clientOrigin = origin) =>
    Buffer.from(
      JSON.stringify({
        type,
        challenge,
        origin: clientOrigin,
        crossOrigin: false,
      }),
    );
  return {
    id,
    register(challenge, overrides = {}) {
      return {
        response: {
          id,
          rawId: id,
          type: 'public-key',
          clientExtensionResults: {},
          response: {
            clientDataJSON: encode(
              clientData('webauthn.create', challenge, overrides.origin),
            ),
            attestationObject: encode(
              cbor(
                new Map([
                  ['fmt', 'none'],
                  ['attStmt', new Map()],
                  ['authData', authData(0, true, overrides.rpID)],
                ]),
              ),
            ),
            transports: ['internal'],
          },
        },
        name: 'Test device',
      };
    },
    authenticate(challenge, counter = 1, overrides = {}) {
      const client = clientData('webauthn.get', challenge, overrides.origin);
      const data = authData(counter, false, overrides.rpID);
      const signature = sign(
        'sha256',
        Buffer.concat([data, hash(client)]),
        privateKey,
      );
      if (overrides.badSignature) signature[signature.length - 1] ^= 1;
      return {
        response: {
          id,
          rawId: id,
          type: 'public-key',
          clientExtensionResults: {},
          response: {
            clientDataJSON: encode(client),
            authenticatorData: encode(data),
            signature: encode(signature),
            userHandle: null,
          },
        },
      };
    },
  };
}

async function fixture({ useDefaultOrigin = false, enabled = true } = {}) {
  const db = {
    users: [],
    accounts: [],
    sessions: [],
    verifications: [],
    passkeys: [],
  };
  const options = resolveAuthApplicationModuleOptions({
    betterAuth: {
      baseUrl: `${origin}/api/auth`,
      secret: 'passkey-test-secret-with-at-least-32-characters',
      callbackUrls: {
        verifyEmail: `${origin}/verify-email`,
        resetPassword: `${origin}/reset-password`,
      },
    },
    plugins: {
      passkeys: {
        enabled,
        rpID,
        rpName: 'Passkey test',
        origin: useDefaultOrigin ? undefined : origin,
      },
    },
  });
  const engine = new BetterAuthAuthEngineAdapter(
    options,
    { resolveDatabase: async () => memoryAdapter(db) },
    {
      hash: async (password) => `test:${password}`,
      compare: async (password, stored) => stored === `test:${password}`,
    },
  );
  const service = new AuthPasskeyService(
    engine,
    {
      resolveAuthUserById: async (id) =>
        db.users?.find((user) => user.id === id) ?? null,
    },
    { rulesForLoadedAuthUser: () => [{ action: 'read', subject: 'Profile' }] },
  );
  const registerUser = async (email) => {
    await engine.register({
      email,
      name: 'Test user',
      password: 'Passphrase123!',
      confirmPassword: 'Passphrase123!',
    });
    const session = await engine.login({
      credential: email,
      password: 'Passphrase123!',
    });
    return { userId: session.userId, cookie: cookie(session.headers) };
  };
  const user = await registerUser('passkey@example.test');
  const device = authenticator();
  const beginRegistration = async () => {
    const result = await service.beginRegistration(
      {},
      requestHeaders(user.cookie),
    );
    return {
      challenge: result.body.challenge,
      headers: requestHeaders(user.cookie, cookie(result.headers)),
    };
  };
  const enroll = async () => {
    const begin = await beginRegistration();
    const result = await service.finishRegistration(
      device.register(begin.challenge),
      begin.headers,
    );
    assert.deepEqual(result.body, { success: true });
  };
  const beginAuthentication = async () => {
    const result = await service.beginAuthentication({}, new Headers());
    assert.equal(result.body.rpId, rpID);
    assert.equal(result.body.userVerification, 'preferred');
    return {
      challenge: result.body.challenge,
      headers: requestHeaders(cookie(result.headers)),
    };
  };
  return {
    db,
    engine,
    service,
    user,
    device,
    registerUser,
    beginRegistration,
    enroll,
    beginAuthentication,
  };
}

test('real registration and authentication persist the counter and return the shared session envelope', async () => {
  const f = await fixture();
  await f.enroll();
  assert.equal(f.db.passkeys[0].userId, f.user.userId);
  assert.equal(f.db.passkeys[0].counter, 0);
  const begin = await f.beginAuthentication();
  const result = await f.service.finishAuthentication(
    f.device.authenticate(begin.challenge),
    begin.headers,
  );
  assert.equal(result.body.user.id, f.user.userId);
  assert.deepEqual(result.body.rbac, [{ action: 'read', subject: 'Profile' }]);
  assert.equal('session' in result.body, false);
  assert.equal('token' in result.body, false);
  assert.equal(f.db.passkeys[0].counter, 1);
  assert.equal(
    (await f.engine.getSession(requestHeaders(cookie(result.headers)))).userId,
    f.user.userId,
  );
});

test('registration requires a session at both begin and finish and binds the challenge to that user', async () => {
  const f = await fixture();
  await assert.rejects(f.service.beginRegistration({}, new Headers()), invalid);
  const begin = await f.beginRegistration();
  const challengeCookie = begin.headers
    .get('cookie')
    .split('; ')
    .filter((value) => value.includes('passkey'))
    .join('; ');
  await assert.rejects(
    f.service.finishRegistration(
      f.device.register(begin.challenge),
      requestHeaders(challengeCookie),
    ),
    invalid,
  );
  const other = await f.registerUser('other@example.test');
  await assert.rejects(
    f.service.finishRegistration(
      f.device.register(begin.challenge),
      requestHeaders(other.cookie, challengeCookie),
    ),
    invalid,
  );
  assert.equal(count(f.db, 'passkeys'), 0);
});

for (const ceremony of ['registration', 'authentication']) {
  for (const failure of [
    'challenge',
    'origin',
    'rpID',
    'expired',
    'missing-cookie',
    'tampered-cookie',
  ]) {
    test(`${ceremony} rejects ${failure} without storing credentials or issuing sessions`, async () => {
      const f = await fixture();
      if (ceremony === 'authentication') await f.enroll();
      const begin =
        ceremony === 'registration'
          ? await f.beginRegistration()
          : await f.beginAuthentication();
      const sessions = count(f.db, 'sessions');
      const credentials = count(f.db, 'passkeys');
      const overrides =
        failure === 'origin'
          ? { origin: 'https://attacker.test' }
          : failure === 'rpID'
            ? { rpID: 'attacker.test' }
            : {};
      const challenge =
        failure === 'challenge'
          ? encode('incorrect challenge')
          : begin.challenge;
      const payload =
        ceremony === 'registration'
          ? f.device.register(challenge, overrides)
          : f.device.authenticate(challenge, 1, overrides);
      if (failure === 'expired') {
        const row = f.db.verifications.find(
          (entry) =>
            JSON.parse(entry.value).expectedChallenge === begin.challenge,
        );
        row.expiresAt = new Date(Date.now() - 1000);
      }
      if (failure === 'missing-cookie')
        begin.headers = requestHeaders(
          ceremony === 'registration' ? f.user.cookie : '',
        );
      if (failure === 'tampered-cookie')
        begin.headers.set(
          'cookie',
          begin.headers.get('cookie').replace(/(passkey=)[^;]+/, '$1forged'),
        );
      // Keep the transport origin trusted so the signed WebAuthn origin itself is checked.
      begin.headers.set('origin', origin);
      const finish = () =>
        ceremony === 'registration'
          ? f.service.finishRegistration(payload, begin.headers)
          : f.service.finishAuthentication(payload, begin.headers);
      await assert.rejects(finish(), invalid);
      assert.equal(count(f.db, 'sessions'), sessions);
      assert.equal(count(f.db, 'passkeys'), credentials);
      if (ceremony === 'authentication')
        assert.equal(f.db.passkeys[0].counter, 0);
    });
  }
}

test('successful and failed verification consume the challenge, including concurrent replay', async () => {
  const f = await fixture();
  const registration = await f.beginRegistration();
  const credential = f.device.register(registration.challenge);
  await f.service.finishRegistration(credential, registration.headers);
  await assert.rejects(
    f.service.finishRegistration(credential, registration.headers),
    invalid,
  );
  let begin = await f.beginAuthentication();
  await assert.rejects(
    f.service.finishAuthentication(
      f.device.authenticate(begin.challenge, 1, { badSignature: true }),
      begin.headers,
    ),
    invalid,
  );
  await assert.rejects(
    f.service.finishAuthentication(
      f.device.authenticate(begin.challenge),
      begin.headers,
    ),
    invalid,
  );
  begin = await f.beginAuthentication();
  const response = f.device.authenticate(begin.challenge);
  const attempts = await Promise.allSettled([
    f.service.finishAuthentication(response, begin.headers),
    f.service.finishAuthentication(response, begin.headers),
  ]);
  assert.equal(
    attempts.filter((entry) => entry.status === 'fulfilled').length,
    1,
  );
  assert.equal(
    attempts.filter((entry) => entry.status === 'rejected').length,
    1,
  );
  assert.equal(f.db.passkeys[0].counter, 1);
});

test('registration and authentication challenges cannot be exchanged', async () => {
  const f = await fixture();
  await f.enroll();
  const registration = await f.beginRegistration();
  await assert.rejects(
    f.service.finishAuthentication(
      f.device.authenticate(registration.challenge),
      registration.headers,
    ),
    invalid,
  );
  const authentication = await f.beginAuthentication();
  const device = authenticator();
  await assert.rejects(
    f.service.finishRegistration(
      device.register(authentication.challenge),
      requestHeaders(f.user.cookie, authentication.headers.get('cookie')),
    ),
    invalid,
  );
});

test('stale and decreasing counters fail; authenticators without counters may continue reporting zero', async () => {
  const f = await fixture();
  await f.enroll();
  for (const counter of [0, 0, 2]) {
    const begin = await f.beginAuthentication();
    await f.service.finishAuthentication(
      f.device.authenticate(begin.challenge, counter),
      begin.headers,
    );
  }
  for (const counter of [2, 1, 0]) {
    const begin = await f.beginAuthentication();
    const sessions = count(f.db, 'sessions');
    await assert.rejects(
      f.service.finishAuthentication(
        f.device.authenticate(begin.challenge, counter),
        begin.headers,
      ),
      invalid,
    );
    assert.equal(f.db.passkeys[0].counter, 2);
    assert.equal(count(f.db, 'sessions'), sessions);
  }
});

test('unknown credentials and mismatched id/rawId fail', async () => {
  const f = await fixture();
  await f.enroll();
  const begin = await f.beginAuthentication();
  await assert.rejects(
    f.service.finishAuthentication(
      authenticator().authenticate(begin.challenge),
      begin.headers,
    ),
    invalid,
  );
  const dto = f.device.authenticate(begin.challenge);
  dto.response.rawId = encode('different-id');
  await assert.rejects(
    f.service.finishAuthentication(dto, begin.headers),
    invalid,
  );
});

test('default expected origin comes from baseUrl, never an incoming Origin header', async () => {
  const f = await fixture({ useDefaultOrigin: true });
  await f.enroll();
  const begin = await f.beginAuthentication();
  begin.headers.set('origin', 'https://attacker.test');
  await assert.rejects(
    f.service.finishAuthentication(
      f.device.authenticate(begin.challenge, 1, {
        origin: 'https://attacker.test',
      }),
      begin.headers,
    ),
    invalid,
  );
});

test('disabled passkeys and caller-selected verification policy fail closed', async () => {
  const f = await fixture({ enabled: false });
  await assert.rejects(
    f.service.beginAuthentication({}, new Headers()),
    (error) => error.getStatus() === 501,
  );
  for (const body of [
    { challenge: 'chosen' },
    { userId: 'chosen' },
    { origin: 'https://attacker.test' },
  ]) {
    await assert.rejects(
      f.service.beginRegistration(body, requestHeaders(f.user.cookie)),
      invalid,
    );
    await assert.rejects(
      f.service.beginAuthentication(body, new Headers()),
      invalid,
    );
  }
});

test('registration finish rejects caller-controlled identity and session policy before reaching the engine', async () => {
  const f = await fixture();
  const begin = await f.beginRegistration();
  for (const extra of [
    { createSession: true },
    { userId: 'other-user' },
    { context: 'untrusted' },
  ]) {
    await assert.rejects(
      f.service.finishRegistration(
        { ...f.device.register(begin.challenge), ...extra },
        begin.headers,
      ),
      invalid,
    );
  }
  assert.equal(count(f.db, 'passkeys'), 0);
});
