import { Static, Type } from '@sinclair/typebox';

export const SubmissionResponseSchema = Type.Object({
  success: Type.Boolean(),
});

export type SubmissionResponseDTO = Static<typeof SubmissionResponseSchema>;
