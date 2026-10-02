import {
  createHash,
  generateKeyPairSync,
  randomBytes,
  sign,
} from 'node:crypto';

export const origin = 'https://login.example.test';
export const rpID = 'example.test';

const hash = (data) => createHash('sha256').update(data).digest();
export const encode = (data) => Buffer.from(data).toString('base64url');
export const cookie = (headers) =>
  headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
export const requestHeaders = (...cookies) =>
  new Headers({ cookie: cookies.filter(Boolean).join('; ') });

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

export function authenticator({
  credentialIdLength = 32,
  registrationCounter = 0,
  backedUp = false,
  origin: authenticatorOrigin = origin,
  rpID: authenticatorRpID = rpID,
} = {}) {
  const { publicKey, privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
  });
  const jwk = publicKey.export({ format: 'jwk' });
  const credentialID = randomBytes(credentialIdLength);
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
  const authData = (counter, registering, relyingParty = authenticatorRpID) => {
    const countBytes = Buffer.alloc(4);
    countBytes.writeUInt32BE(counter);
    return Buffer.concat([
      hash(relyingParty),
      Buffer.from([(registering ? 0x45 : 0x05) | (backedUp ? 0x18 : 0)]),
      countBytes,
      ...(registering
        ? [
            Buffer.alloc(16),
            Buffer.from([credentialID.length >> 8, credentialID.length & 255]),
            credentialID,
            key,
          ]
        : []),
    ]);
  };
  const clientData = (type, challenge, clientOrigin = authenticatorOrigin) =>
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
                  [
                    'authData',
                    authData(registrationCounter, true, overrides.rpID),
                  ],
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
