import { Static, Type } from '@sinclair/typebox';

export const SubmissionResponseSchema = Type.Object({
  id: Type.String(),
  formId: Type.String(),
  formVersion: Type.Integer({ minimum: 1 }),
  payload: Type.Record(Type.String(), Type.Unknown()),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
});

export type SubmissionResponseDTO = Static<typeof SubmissionResponseSchema>;
