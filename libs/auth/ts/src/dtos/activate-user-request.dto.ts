import { ActivateUserRequestSchema as canonical } from '@anarchitects/auth-contracts';
import type { Static } from '@sinclair/typebox';
import { canonicalTypeBox } from '../contracts/canonical-typebox.js';

export const ActivateUserRequestSchema = canonicalTypeBox(canonical);

export type ActivateUserRequestDTO = Static<typeof ActivateUserRequestSchema>;
