import { JwtTokensResponseSchema as canonical } from '@anarchitects/auth-contracts';
import type { Static } from '@sinclair/typebox';
import { canonicalTypeBox } from '../contracts/canonical-typebox.js';

export const LoginResponseSchema = canonicalTypeBox(canonical, {
  legacyOpenObject: true,
});

export type LoginResponseDTO = Static<typeof LoginResponseSchema>;
