import { Static, Type } from '@sinclair/typebox';

export const SubmissionRequestSchema = Type.Object({
  formId: Type.String(),
  formVersion: Type.Integer({ minimum: 1 }),
  payload: Type.Record(Type.String(), Type.Unknown()),
});

export type SubmissionRequestDTO = Static<typeof SubmissionRequestSchema>;
