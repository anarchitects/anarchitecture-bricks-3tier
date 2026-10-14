import { UpdateEmailRequestSchema as canonical } from '@anarchitects/auth-contracts';
import type { Static } from '@sinclair/typebox';
import { canonicalTypeBox } from '../contracts/canonical-typebox.js';

export const UpdateEmailRequestSchema = canonicalTypeBox(canonical);

export type UpdateEmailRequestDTO = Static<typeof UpdateEmailRequestSchema>;
