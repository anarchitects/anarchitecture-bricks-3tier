import { SubmissionIdParamsSchema as CanonicalSchema } from '@anarchitects/forms-contracts';
import { canonicalTypeBox } from './canonical-typebox.js';
import type { Static } from '@sinclair/typebox';

export const SubmissionIdParamsSchema = canonicalTypeBox(CanonicalSchema);
export type SubmissionIdParamsDTO = Static<typeof SubmissionIdParamsSchema>;
