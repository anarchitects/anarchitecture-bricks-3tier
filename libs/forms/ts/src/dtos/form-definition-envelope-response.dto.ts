import { Static, Type } from '@sinclair/typebox';

export const FormDefinitionEnvelopeResponseSchema = Type.Object({
  config: Type.Unknown(),
  schema: Type.Unknown(),
});

export type FormDefinitionEnvelopeResponseDTO = Static<
  typeof FormDefinitionEnvelopeResponseSchema
>;
