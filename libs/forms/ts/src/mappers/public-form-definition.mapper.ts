import type {
  PublicFormDefinitionEnvelopeResponseDTO,
  PublicFormDefinitionResponseDTO,
  FormDeliveryStatusDTO,
} from '../dtos/public-form-definition-response.dto.js';
import type { FormConfig } from '../models/form.types.js';
import { schemaFromConfig } from '../builders/schema.builder.js';

/** Explicit public projection: never echo delivery settings, even to administrators. */
export function toPublicFormDefinitionResponseDTO(
  config: FormConfig,
): PublicFormDefinitionResponseDTO {
  return {
    id: config.id,
    version: config.version,
    fields: config.fields.map((field) => ({
      name: field.name,
      kind: field.kind,
      required: field.required,
      minLength: field.minLength,
      maxLength: field.maxLength,
      pattern: field.pattern,
      options: field.options?.map((option) => ({
        value: option.value,
        label: option.label,
      })),
      ui: field.ui
        ? {
            label: field.ui.label,
            placeholder: field.ui.placeholder,
            rows: field.ui.rows,
            help: field.ui.help,
          }
        : undefined,
    })),
    validationRules: config.validationRules?.map((rule) => ({
      kind: rule.kind,
      sourceField: rule.sourceField,
      targetField: rule.targetField,
      message: rule.message,
    })),
    security: config.security
      ? {
          captcha: config.security.captcha ?? 'none',
          honeypot: config.security.honeypot,
        }
      : undefined,
  };
}

export function toPublicFormDefinitionEnvelopeResponseDTO(model: {
  config: FormConfig;
}): PublicFormDefinitionEnvelopeResponseDTO {
  const config = toPublicFormDefinitionResponseDTO(model.config);
  // Generate from the safe config; do not forward arbitrary adapter metadata.
  return { config, schema: schemaFromConfig(config) };
}

/** For a host's restricted management view; no secret read endpoint is added. */
export function toFormDeliveryStatusDTO(
  config: FormConfig,
): FormDeliveryStatusDTO {
  return { configured: !!config.delivery };
}
