import * as canonical from '@anarchitects/auth-contracts/passkeys';
import type { Static } from '@sinclair/typebox';
import { canonicalTypeBox } from '../../contracts/canonical-typebox.js';
import { LoggedInUserInfoResponseSchema } from '../logged-in-user-info-response.dto.js';
import { PasskeyAuthenticationOptionsSchema } from './webauthn-json.schemas.js';

export const PasskeyAuthenticationBeginRequestSchema = canonicalTypeBox(
  canonical.PasskeyAuthenticationBeginRequestSchema,
);
export const PasskeyAuthenticationBeginResponseSchema =
  PasskeyAuthenticationOptionsSchema;
export const PasskeyAuthenticationFinishRequestSchema = canonicalTypeBox(
  canonical.PasskeyAuthenticationFinishRequestSchema,
);
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
