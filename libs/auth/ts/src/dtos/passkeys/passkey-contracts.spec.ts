import { type TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import Ajv from 'ajv';
import { describe, expect, expectTypeOf, it } from 'vitest';
import * as passkeys from './index';
import * as core from '../index';
import * as root from '../../index';

// Structural wire fixtures only: these bytes are not cryptographically valid credentials.
const creationOptions = {
  rp: { id: 'example.com', name: 'Example' },
  user: { id: 'dXNlci1pZA', name: 'user@example.com', displayName: 'User' },
  challenge: 'Y2hhbGxlbmdl',
  pubKeyCredParams: [
    { type: 'public-key', alg: -7 },
    { type: 'public-key', alg: -257 },
  ],
  timeout: 60000,
  excludeCredentials: [
    {
      id: 'Y3JlZGVudGlhbA',
      type: 'public-key',
      transports: ['internal', 'hybrid'],
    },
  ],
  authenticatorSelection: {
    residentKey: 'preferred',
    userVerification: 'required',
  },
  attestation: 'none',
  extensions: { credProps: true },
} satisfies passkeys.PasskeyRegistrationBeginResponseDTO;

const requestOptions = {
  challenge: 'Y2hhbGxlbmdl',
  rpId: 'example.com',
  userVerification: 'required',
} satisfies passkeys.PasskeyAuthenticationBeginResponseDTO;

const registration = {
  response: {
    id: 'Y3JlZGVudGlhbA',
    rawId: 'Y3JlZGVudGlhbA',
    type: 'public-key',
    authenticatorAttachment: 'platform',
    clientExtensionResults: { credProps: { rk: true } },
    response: {
      clientDataJSON: 'Y2xpZW50LWRhdGE',
      attestationObject: 'YXR0ZXN0YXRpb24',
    },
  },
  name: 'My device',
} satisfies passkeys.PasskeyRegistrationFinishRequestDTO;

const authentication = {
  response: {
    id: 'Y3JlZGVudGlhbA',
    rawId: 'Y3JlZGVudGlhbA',
    type: 'public-key',
    clientExtensionResults: {},
    response: {
      clientDataJSON: 'Y2xpZW50LWRhdGE',
      authenticatorData: 'YXV0aGVudGljYXRvcg',
      signature: 'c2lnbmF0dXJl',
    },
  },
} satisfies passkeys.PasskeyAuthenticationFinishRequestDTO;

const schemaCases: [string, TSchema, unknown][] = [
  [
    'registration begin request',
    passkeys.PasskeyRegistrationBeginRequestSchema,
    { authenticatorAttachment: 'platform' },
  ],
  [
    'registration begin response',
    passkeys.PasskeyRegistrationBeginResponseSchema,
    creationOptions,
  ],
  [
    'registration finish request',
    passkeys.PasskeyRegistrationFinishRequestSchema,
    registration,
  ],
  [
    'registration finish response',
    passkeys.PasskeyRegistrationFinishResponseSchema,
    { success: true },
  ],
  [
    'authentication begin request',
    passkeys.PasskeyAuthenticationBeginRequestSchema,
    {},
  ],
  [
    'authentication begin response',
    passkeys.PasskeyAuthenticationBeginResponseSchema,
    requestOptions,
  ],
  [
    'authentication finish request',
    passkeys.PasskeyAuthenticationFinishRequestSchema,
    authentication,
  ],
  [
    'authentication finish response',
    passkeys.PasskeyAuthenticationFinishResponseSchema,
    {
      user: { id: 'user-id', email: 'user@example.com' },
      rbac: [{ action: 'read', subject: 'Post' }],
    },
  ],
];

describe('Passkey v1 transport contracts', () => {
  it.each(schemaCases)(
    'validates %s through TypeBox and serialized JSON Schema',
    (_name, schema, payload) => {
      const serializedPayload: unknown = JSON.parse(JSON.stringify(payload));
      expect(Value.Check(schema, serializedPayload)).toBe(true);
      const validate = new Ajv({ strict: true }).compile(
        JSON.parse(JSON.stringify(schema)),
      );
      expect(validate(serializedPayload), JSON.stringify(validate.errors)).toBe(
        true,
      );
    },
  );

  it('keeps optional passkey contracts on their versioned public subpath', () => {
    expect(passkeys.PASSKEY_CONTRACT_VERSION).toBe('1.0.0');
    expect(core).not.toHaveProperty('PasskeyRegistrationBeginRequestSchema');
    expect(root).not.toHaveProperty('PasskeyRegistrationBeginRequestSchema');
    expect(passkeys.PasskeyAuthenticationFinishResponseSchema).toBe(
      core.LoggedInUserInfoResponseSchema,
    );
    expect(passkeys.PasskeyRegistrationFinishResponseSchema).toBe(
      core.SuccessResponseSchema,
    );
    expectTypeOf<
      passkeys.PasskeyRegistrationFinishRequestDTO['response']
    >().toEqualTypeOf<passkeys.PasskeyRegistrationCredentialDTO>();
    expectTypeOf<
      passkeys.PasskeyAuthenticationFinishRequestDTO['response']
    >().toEqualTypeOf<passkeys.PasskeyAuthenticationCredentialDTO>();
  });

  it('accepts minimal begin requests and discoverable authentication options', () => {
    expect(
      Value.Check(passkeys.PasskeyRegistrationBeginRequestSchema, {}),
    ).toBe(true);
    expect(
      Value.Check(passkeys.PasskeyAuthenticationOptionsSchema, {
        challenge: 'Y2hhbGxlbmdl',
      }),
    ).toBe(true);
    expect(
      Value.Check(passkeys.PasskeyAuthenticationOptionsSchema, {
        ...requestOptions,
        allowCredentials: [],
      }),
    ).toBe(true);
  });

  it.each([
    'userId',
    'challenge',
    'origin',
    'rpId',
    'userVerification',
    'createSession',
    'context',
  ])('rejects caller-controlled %s on begin and finish envelopes', (key) => {
    for (const [schema, body] of [
      [passkeys.PasskeyRegistrationBeginRequestSchema, {}],
      [passkeys.PasskeyAuthenticationBeginRequestSchema, {}],
      [passkeys.PasskeyRegistrationFinishRequestSchema, registration],
      [passkeys.PasskeyAuthenticationFinishRequestSchema, authentication],
    ] as const) {
      expect(Value.Check(schema, { ...body, [key]: 'untrusted' })).toBe(false);
    }
  });

  it.each(['', 'with+plus', 'with/slash', 'cGFkZA==', 'white space'])(
    'rejects invalid base64url data: %j',
    (value) => {
      expect(
        Value.Check(passkeys.PasskeyRegistrationOptionsSchema, {
          ...creationOptions,
          challenge: value,
        }),
      ).toBe(false);
      expect(
        Value.Check(passkeys.PasskeyAuthenticationFinishRequestSchema, {
          response: { ...authentication.response, rawId: value },
        }),
      ).toBe(false);
      expect(
        Value.Check(passkeys.PasskeyRegistrationFinishRequestSchema, {
          response: {
            ...registration.response,
            response: {
              ...registration.response.response,
              attestationObject: value,
            },
          },
        }),
      ).toBe(false);
    },
  );

  it('requires complete ceremony-specific credential responses', () => {
    for (const field of [
      'id',
      'rawId',
      'type',
      'clientExtensionResults',
      'response',
    ]) {
      const candidate: Record<string, unknown> = { ...authentication.response };
      delete candidate[field];
      expect(
        Value.Check(passkeys.PasskeyAuthenticationCredentialSchema, candidate),
      ).toBe(false);
    }
    for (const field of ['clientDataJSON', 'authenticatorData', 'signature']) {
      const response: Record<string, unknown> = {
        ...authentication.response.response,
      };
      delete response[field];
      expect(
        Value.Check(passkeys.PasskeyAuthenticationCredentialSchema, {
          ...authentication.response,
          response,
        }),
      ).toBe(false);
    }
    expect(
      Value.Check(
        passkeys.PasskeyRegistrationCredentialSchema,
        authentication.response,
      ),
    ).toBe(false);
    expect(
      Value.Check(
        passkeys.PasskeyAuthenticationCredentialSchema,
        registration.response,
      ),
    ).toBe(false);
    expect(
      Value.Check(passkeys.PasskeyRegistrationCredentialSchema, {
        ...registration.response,
        type: 'password',
      }),
    ).toBe(false);
    expect(
      Value.Check(passkeys.PasskeyAuthenticationCredentialSchema, {
        ...authentication.response,
        rawId: new Uint8Array([1, 2]),
      }),
    ).toBe(false);
  });

  it('supports optional registration convenience fields and future transport hints', () => {
    expect(
      Value.Check(passkeys.PasskeyRegistrationCredentialSchema, {
        ...registration.response,
        response: {
          ...registration.response.response,
          authenticatorData: 'YXV0aGVudGljYXRvcg',
          publicKey: 'cHVibGljLWtleQ',
          publicKeyAlgorithm: -7,
          transports: ['internal', 'hybrid', 'future-transport'],
        },
        clientExtensionResults: {
          credProps: { rk: true },
          futureExtension: { enabled: true, values: ['a', 1] },
        },
      }),
    ).toBe(true);
  });

  it.each([undefined, null, 'dXNlci1pZA'])(
    'accepts a missing, null, or encoded user handle (%j)',
    (userHandle) => {
      expect(
        Value.Check(passkeys.PasskeyAuthenticationCredentialSchema, {
          ...authentication.response,
          response: { ...authentication.response.response, userHandle },
        }),
      ).toBe(true);
    },
  );

  it.each(['', '   ', 'x'.repeat(256)])(
    'rejects invalid passkey labels (%j)',
    (name) => {
      expect(
        Value.Check(passkeys.PasskeyRegistrationFinishRequestSchema, {
          ...registration,
          name,
        }),
      ).toBe(false);
    },
  );

  it.each([
    { ...creationOptions, challenge: undefined },
    {
      ...creationOptions,
      user: { ...creationOptions.user, id: 'x'.repeat(87) },
    },
    { ...creationOptions, pubKeyCredParams: [] },
    {
      ...creationOptions,
      pubKeyCredParams: [{ type: 'public-key', alg: 1.5 }],
    },
    { ...creationOptions, timeout: -1 },
    {
      ...creationOptions,
      authenticatorSelection: { userVerification: 'sometimes' },
    },
  ])('rejects malformed registration options', (candidate) => {
    expect(
      Value.Check(passkeys.PasskeyRegistrationOptionsSchema, candidate),
    ).toBe(false);
  });

  it('provides pure route-schema pairs using the exact DTO schemas', () => {
    const routes = [
      passkeys.PasskeyRegistrationBeginRouteSchema,
      passkeys.PasskeyRegistrationFinishRouteSchema,
      passkeys.PasskeyAuthenticationBeginRouteSchema,
      passkeys.PasskeyAuthenticationFinishRouteSchema,
    ];
    routes.forEach((route, index) => {
      expect(Object.keys(route).sort()).toEqual(['body', 'response']);
      expect(route.body).toBe(schemaCases[index * 2][1]);
      expect(route.response[200]).toBe(schemaCases[index * 2 + 1][1]);
    });
  });
});
