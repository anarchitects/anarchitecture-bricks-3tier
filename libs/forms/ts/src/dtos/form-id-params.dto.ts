import { Static, Type } from '@sinclair/typebox';

export const FormIdParamsSchema = Type.Object({
  formId: Type.String(),
});

export type FormIdParamsDTO = Static<typeof FormIdParamsSchema>;
