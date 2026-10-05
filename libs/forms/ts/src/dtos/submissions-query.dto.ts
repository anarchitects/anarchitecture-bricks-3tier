import { Static, Type } from '@sinclair/typebox';

export const SubmissionsQuerySchema = Type.Object({
  formId: Type.Optional(Type.String({ minLength: 1 })),
  formVersion: Type.Optional(Type.Integer({ minimum: 1 })),
});

export type SubmissionsQueryDTO = Static<typeof SubmissionsQuerySchema>;
