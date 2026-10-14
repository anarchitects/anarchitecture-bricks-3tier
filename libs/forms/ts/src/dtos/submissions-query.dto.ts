import { SubmissionsQuerySchema as CanonicalSchema } from '@anarchitects/forms-contracts';
import { canonicalTypeBox } from './canonical-typebox.js';
import type { Static } from '@sinclair/typebox';

export const SubmissionsQuerySchema = canonicalTypeBox(CanonicalSchema);
export type SubmissionsQueryDTO = Static<typeof SubmissionsQuerySchema>;
