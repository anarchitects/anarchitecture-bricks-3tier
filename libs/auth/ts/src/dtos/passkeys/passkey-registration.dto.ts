import { type Static, Type } from '@sinclair/typebox';
import { SuccessResponseSchema } from '../success-response.dto';
import {
  PasskeyAuthenticatorAttachmentSchema,
  PasskeyRegistrationCredentialSchema,
  PasskeyRegistrationOptionsSchema,
} from './webauthn-json.schemas';

/** Register for the authenticated user; user identity and verification policy are server-owned. */
export const PasskeyRegistrationBeginRequestSchema = Type.Object(
  {
    authenticatorAttachment: Type.Optional(
      PasskeyAuthenticatorAttachmentSchema,
    ),
  },
  { additionalProperties: false },
);

export const PasskeyRegistrationBeginResponseSchema =
  PasskeyRegistrationOptionsSchema;

/** Browser attestation plus an optional display label; never accepts a client-selected userId. */
export const PasskeyRegistrationFinishRequestSchema = Type.Object(
  {
    response: PasskeyRegistrationCredentialSchema,
    name: Type.Optional(
      Type.String({ minLength: 1, maxLength: 255, pattern: '\\S' }),
    ),
  },
  { additionalProperties: false },
);

/** Registration adds a credential to the existing session; persistence details stay private. */
export const PasskeyRegistrationFinishResponseSchema = SuccessResponseSchema;

export type PasskeyRegistrationBeginRequestDTO = Static<
  typeof PasskeyRegistrationBeginRequestSchema
>;
export type PasskeyRegistrationBeginResponseDTO = Static<
  typeof PasskeyRegistrationBeginResponseSchema
>;
export type PasskeyRegistrationFinishRequestDTO = Static<
  typeof PasskeyRegistrationFinishRequestSchema
>;
export type PasskeyRegistrationFinishResponseDTO = Static<
  typeof PasskeyRegistrationFinishResponseSchema
>;
