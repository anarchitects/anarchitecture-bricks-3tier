import { Static, Type } from '@sinclair/typebox';
import { SubmissionResponseSchema } from './submission-response.dto';

export const SubmissionsResponseSchema = Type.Array(SubmissionResponseSchema);

export type SubmissionsResponseDTO = Static<typeof SubmissionsResponseSchema>;
