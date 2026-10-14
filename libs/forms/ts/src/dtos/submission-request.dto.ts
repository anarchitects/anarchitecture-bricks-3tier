import { SubmissionRequestSchema as CanonicalSchema } from '@anarchitects/forms-contracts';
import { canonicalTypeBox } from './canonical-typebox.js';
import type { Static } from '@sinclair/typebox';

export const SubmissionRequestSchema = canonicalTypeBox(CanonicalSchema);
export type SubmissionRequestDTO = Static<typeof SubmissionRequestSchema>;
