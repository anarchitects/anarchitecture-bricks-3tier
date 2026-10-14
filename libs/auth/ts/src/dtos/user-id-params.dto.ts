import { UserIdParamsSchema as canonical } from '@anarchitects/auth-contracts';
import type { Static } from '@sinclair/typebox';
import { canonicalTypeBox } from '../contracts/canonical-typebox.js';

export const UserIdParamsSchema = canonicalTypeBox(canonical);

export type UserIdParamsDTO = Static<typeof UserIdParamsSchema>;
