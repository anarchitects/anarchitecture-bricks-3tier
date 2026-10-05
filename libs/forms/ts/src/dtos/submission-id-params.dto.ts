import { Static, Type } from '@sinclair/typebox';

export const SubmissionIdParamsSchema = Type.Object({
  submissionId: Type.String({ format: 'uuid' }),
});

export type SubmissionIdParamsDTO = Static<typeof SubmissionIdParamsSchema>;
