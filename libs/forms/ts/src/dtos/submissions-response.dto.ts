import { SubmissionsResponseSchema as CanonicalSchema } from '@anarchitects/forms-contracts';
import { canonicalTypeBox } from './canonical-typebox.js';
import type { Static } from '@sinclair/typebox';

export const SubmissionsResponseSchema = canonicalTypeBox(CanonicalSchema);
export type SubmissionsResponseDTO = Static<typeof SubmissionsResponseSchema>;
