import { JwtRefreshRequestSchema as canonical } from '@anarchitects/auth-contracts';
import type { Static } from '@sinclair/typebox';
import { canonicalTypeBox } from '../contracts/canonical-typebox.js';

export const RefreshTokenRequestSchema = canonicalTypeBox(canonical);

export type RefreshTokenRequestDTO = Static<typeof RefreshTokenRequestSchema>;
