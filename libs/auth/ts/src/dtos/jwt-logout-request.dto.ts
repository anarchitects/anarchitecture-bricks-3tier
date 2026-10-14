import { JwtLogoutRequestSchema as canonical } from '@anarchitects/auth-contracts';
import type { Static } from '@sinclair/typebox';
import { canonicalTypeBox } from '../contracts/canonical-typebox.js';

export const JwtLogoutRequestSchema = canonicalTypeBox(canonical);

export type JwtLogoutRequestDTO = Static<typeof JwtLogoutRequestSchema>;
