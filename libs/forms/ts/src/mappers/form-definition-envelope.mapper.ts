import { FormDefinitionEnvelopeResponseDTO } from '../dtos/form-definition-envelope-response.dto.js';
import { FormDefinitionResponseDTO } from '../dtos/form-definition-response.dto.js';
import { FormConfig } from '../models/form.types.js';
import {
  fromFormDefinitionResponseDTO,
  toFormDefinitionResponseDTO,
} from './form-config.mapper.js';

export type FormDefinitionEnvelopeModel = {
  config: FormConfig;
  schema: unknown;
};

const assertObject = (
  value: unknown,
  fieldName: string,
): Record<string, unknown> => {
  if (!value || typeof value !== 'object') {
    throw new Error(`Expected "${fieldName}" to be an object.`);
  }
  return value as Record<string, unknown>;
};

export const toFormDefinitionEnvelopeResponseDTO = (
  model: FormDefinitionEnvelopeModel,
): FormDefinitionEnvelopeResponseDTO => ({
  config: toFormDefinitionResponseDTO(model.config),
  schema: model.schema,
});

export const fromFormDefinitionEnvelopeResponseDTO = (
  dto: FormDefinitionEnvelopeResponseDTO,
): FormDefinitionEnvelopeModel => {
  assertObject(dto, 'form definition envelope response');
  const config = assertObject(dto.config, 'config');

  return {
    config: fromFormDefinitionResponseDTO(config as FormDefinitionResponseDTO),
    schema: dto.schema,
  };
};
