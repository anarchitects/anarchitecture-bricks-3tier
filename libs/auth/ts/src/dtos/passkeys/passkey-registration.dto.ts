import * as canonical from '@anarchitects/auth-contracts/passkeys';
import type { Static } from '@sinclair/typebox';
import { canonicalTypeBox } from '../../contracts/canonical-typebox.js';
import { SuccessResponseSchema } from '../success-response.dto.js';
import { PasskeyRegistrationOptionsSchema } from './webauthn-json.schemas.js';

export const PasskeyRegistrationBeginRequestSchema = canonicalTypeBox(
  canonical.PasskeyRegistrationBeginRequestSchema,
);
export const PasskeyRegistrationBeginResponseSchema =
  PasskeyRegistrationOptionsSchema;
export const PasskeyRegistrationFinishRequestSchema = canonicalTypeBox(
  canonical.PasskeyRegistrationFinishRequestSchema,
);
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
