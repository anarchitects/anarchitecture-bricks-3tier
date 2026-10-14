import * as canonical from '@anarchitects/auth-contracts/passkeys';
import type { Static } from '@sinclair/typebox';
import { canonicalTypeBox } from '../../contracts/canonical-typebox.js';

export const PasskeyBase64UrlSchema = canonicalTypeBox(
  canonical.PasskeyBase64UrlSchema,
);
export const PasskeyAuthenticatorAttachmentSchema = canonicalTypeBox(
  canonical.PasskeyRegistrationBeginRequestSchema.shape.authenticatorAttachment.unwrap()
    .out,
);
export const PasskeyExtensionsSchema = canonicalTypeBox(
  canonical.PasskeyRegistrationBeginResponseSchema.shape.extensions.unwrap(),
);
export const PasskeyCredentialDescriptorSchema = canonicalTypeBox(
  canonical.PasskeyRegistrationBeginResponseSchema.shape.excludeCredentials.unwrap()
    .element,
);
export const PasskeyRegistrationOptionsSchema = canonicalTypeBox(
  canonical.PasskeyRegistrationBeginResponseSchema,
);
export const PasskeyAuthenticationOptionsSchema = canonicalTypeBox(
  canonical.PasskeyAuthenticationBeginResponseSchema,
);
export const PasskeyRegistrationCredentialSchema = canonicalTypeBox(
  canonical.PasskeyRegistrationCredentialSchema,
);
export const PasskeyAuthenticationCredentialSchema = canonicalTypeBox(
  canonical.PasskeyAuthenticationCredentialSchema,
);

export type PasskeyRegistrationCredentialDTO = Static<
  typeof PasskeyRegistrationCredentialSchema
>;
export type PasskeyAuthenticationCredentialDTO = Static<
  typeof PasskeyAuthenticationCredentialSchema
>;
