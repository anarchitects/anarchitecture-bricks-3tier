import { Static, Type } from '@sinclair/typebox';
import { FormDefinitionResponseSchema } from './form-definition-response.dto.js';

export const FormDefinitionEnvelopeResponseSchema = Type.Object({
  config: FormDefinitionResponseSchema,
  schema: Type.Unknown(),
});

export type FormDefinitionEnvelopeResponseDTO = Static<
  typeof FormDefinitionEnvelopeResponseSchema
>;
