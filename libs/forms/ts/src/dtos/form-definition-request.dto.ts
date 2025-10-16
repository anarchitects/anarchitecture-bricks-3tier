import { Static, Type } from '@sinclair/typebox';

export const FormDefinitionRequestSchema = Type.Object({
  formId: Type.String(),
  formVersion: Type.Integer({ minimum: 1 }),
});

export type FormDefinitionRequestDTO = Static<
  typeof FormDefinitionRequestSchema
>;
