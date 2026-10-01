import { type Static, Type } from '@sinclair/typebox';

/** Non-empty, unpadded base64url transport data; cryptographic validation is server-owned. */
export const PasskeyBase64UrlSchema = Type.String({
  minLength: 1,
  pattern: '^[A-Za-z0-9_-]+$',
});

export const PasskeyAuthenticatorAttachmentSchema = Type.Union([
  Type.Literal('platform'),
  Type.Literal('cross-platform'),
]);

const verificationRequirement = Type.Union([
  Type.Literal('required'),
  Type.Literal('preferred'),
  Type.Literal('discouraged'),
]);

// Transport names are hints, not authorization policy. Preserve future browser values.
const transports = Type.Array(Type.String({ minLength: 1 }));

/** Opaque WebAuthn extension JSON; extension interpretation belongs to the verifier/client. */
export const PasskeyExtensionsSchema = Type.Record(
  Type.String(),
  Type.Unknown(),
);

export const PasskeyCredentialDescriptorSchema = Type.Object(
  {
    id: PasskeyBase64UrlSchema,
    type: Type.Literal('public-key'),
    transports: Type.Optional(transports),
  },
  { additionalProperties: false },
);

/** JSON form of creation options. Binary fields must be decoded by the browser adapter. */
export const PasskeyRegistrationOptionsSchema = Type.Object(
  {
    rp: Type.Object(
      {
        id: Type.Optional(Type.String({ minLength: 1 })),
        name: Type.String({ minLength: 1 }),
      },
      { additionalProperties: false },
    ),
    user: Type.Object(
      {
        id: Type.String({ ...PasskeyBase64UrlSchema, maxLength: 86 }),
        name: Type.String(),
        displayName: Type.String(),
      },
      { additionalProperties: false },
    ),
    challenge: PasskeyBase64UrlSchema,
    pubKeyCredParams: Type.Array(
      Type.Object(
        { type: Type.Literal('public-key'), alg: Type.Integer() },
        { additionalProperties: false },
      ),
      { minItems: 1 },
    ),
    timeout: Type.Optional(Type.Integer({ minimum: 0 })),
    excludeCredentials: Type.Optional(
      Type.Array(PasskeyCredentialDescriptorSchema),
    ),
    authenticatorSelection: Type.Optional(
      Type.Object(
        {
          authenticatorAttachment: Type.Optional(
            PasskeyAuthenticatorAttachmentSchema,
          ),
          residentKey: Type.Optional(verificationRequirement),
          requireResidentKey: Type.Optional(Type.Boolean()),
          userVerification: Type.Optional(verificationRequirement),
        },
        { additionalProperties: false },
      ),
    ),
    attestation: Type.Optional(
      Type.Union([
        Type.Literal('none'),
        Type.Literal('indirect'),
        Type.Literal('direct'),
        Type.Literal('enterprise'),
      ]),
    ),
    hints: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
    attestationFormats: Type.Optional(
      Type.Array(Type.String({ minLength: 1 })),
    ),
    extensions: Type.Optional(PasskeyExtensionsSchema),
  },
  { additionalProperties: false },
);

/** JSON form of request options; an absent/empty allowCredentials list supports discoverable credentials. */
export const PasskeyAuthenticationOptionsSchema = Type.Object(
  {
    challenge: PasskeyBase64UrlSchema,
    rpId: Type.Optional(Type.String({ minLength: 1 })),
    timeout: Type.Optional(Type.Integer({ minimum: 0 })),
    allowCredentials: Type.Optional(
      Type.Array(PasskeyCredentialDescriptorSchema),
    ),
    userVerification: Type.Optional(verificationRequirement),
    hints: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
    extensions: Type.Optional(PasskeyExtensionsSchema),
  },
  { additionalProperties: false },
);

/** Serialized attestation, compatible with browser toJSON and legacy WebAuthn serializers. */
export const PasskeyRegistrationCredentialSchema = Type.Object(
  {
    id: PasskeyBase64UrlSchema,
    rawId: PasskeyBase64UrlSchema,
    type: Type.Literal('public-key'),
    authenticatorAttachment: Type.Optional(
      PasskeyAuthenticatorAttachmentSchema,
    ),
    clientExtensionResults: PasskeyExtensionsSchema,
    response: Type.Object(
      {
        clientDataJSON: PasskeyBase64UrlSchema,
        attestationObject: PasskeyBase64UrlSchema,
        // Older serializers omit these convenience fields; the attestation contains them.
        authenticatorData: Type.Optional(PasskeyBase64UrlSchema),
        transports: Type.Optional(transports),
        publicKeyAlgorithm: Type.Optional(Type.Integer()),
        publicKey: Type.Optional(PasskeyBase64UrlSchema),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

/** Serialized assertion. userHandle may be omitted or null for non-discoverable credentials. */
export const PasskeyAuthenticationCredentialSchema = Type.Object(
  {
    id: PasskeyBase64UrlSchema,
    rawId: PasskeyBase64UrlSchema,
    type: Type.Literal('public-key'),
    authenticatorAttachment: Type.Optional(
      PasskeyAuthenticatorAttachmentSchema,
    ),
    clientExtensionResults: PasskeyExtensionsSchema,
    response: Type.Object(
      {
        clientDataJSON: PasskeyBase64UrlSchema,
        authenticatorData: PasskeyBase64UrlSchema,
        signature: PasskeyBase64UrlSchema,
        userHandle: Type.Optional(
          Type.Union([PasskeyBase64UrlSchema, Type.Null()]),
        ),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export type PasskeyRegistrationCredentialDTO = Static<
  typeof PasskeyRegistrationCredentialSchema
>;
export type PasskeyAuthenticationCredentialDTO = Static<
  typeof PasskeyAuthenticationCredentialSchema
>;
