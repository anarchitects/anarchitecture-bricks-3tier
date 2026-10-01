import { type Static, Type } from '@sinclair/typebox';
import { LoggedInUserInfoResponseSchema } from '../logged-in-user-info-response.dto';
import {
  PasskeyAuthenticationCredentialSchema,
  PasskeyAuthenticationOptionsSchema,
} from './webauthn-json.schemas';

/** Discoverable-credential login: no username, userId, challenge, or RP policy supplied by the caller. */
export const PasskeyAuthenticationBeginRequestSchema = Type.Object(
  {},
  { additionalProperties: false },
);
export const PasskeyAuthenticationBeginResponseSchema =
  PasskeyAuthenticationOptionsSchema;

/** Session correlation travels with cookies, not a caller-selected expected challenge. */
export const PasskeyAuthenticationFinishRequestSchema = Type.Object(
  { response: PasskeyAuthenticationCredentialSchema },
  { additionalProperties: false },
);

/** Same session-first user/RBAC envelope as password login; no JWT or engine session object. */
export const PasskeyAuthenticationFinishResponseSchema =
  LoggedInUserInfoResponseSchema;

export type PasskeyAuthenticationBeginRequestDTO = Static<
  typeof PasskeyAuthenticationBeginRequestSchema
>;
export type PasskeyAuthenticationBeginResponseDTO = Static<
  typeof PasskeyAuthenticationBeginResponseSchema
>;
export type PasskeyAuthenticationFinishRequestDTO = Static<
  typeof PasskeyAuthenticationFinishRequestSchema
>;
export type PasskeyAuthenticationFinishResponseDTO = Static<
  typeof PasskeyAuthenticationFinishResponseSchema
>;
