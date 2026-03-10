import { Static, Type } from '@sinclair/typebox';

export const FormDefinitionQuerySchema = Type.Object({
  formVersion: Type.Optional(Type.Integer({ minimum: 1 })),
});

export type FormDefinitionQueryDTO = Static<typeof FormDefinitionQuerySchema>;
