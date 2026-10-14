import { SubmissionResponseSchema as CanonicalSchema } from '@anarchitects/forms-contracts';
import { canonicalTypeBox } from './canonical-typebox.js';
import type { Static } from '@sinclair/typebox';

export const SubmissionResponseSchema = canonicalTypeBox(CanonicalSchema);
export type SubmissionResponseDTO = Static<typeof SubmissionResponseSchema>;
