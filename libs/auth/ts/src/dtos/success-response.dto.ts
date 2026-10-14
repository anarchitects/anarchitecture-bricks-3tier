import { SuccessResponseSchema as canonical } from '@anarchitects/auth-contracts';
import type { Static } from '@sinclair/typebox';
import { canonicalTypeBox } from '../contracts/canonical-typebox.js';

export const SuccessResponseSchema = canonicalTypeBox(canonical, {
  legacyOpenObject: true,
});

export type SuccessResponseDTO = Static<typeof SuccessResponseSchema>;
