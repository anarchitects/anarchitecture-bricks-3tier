import { FormDefinitionResponseDTO } from '../dtos/form-definition-response.dto';
import { FormConfig } from '../models/form.types';

const cloneConfig = (config: FormConfig): FormConfig => ({
  id: config.id,
  version: config.version,
  fields: config.fields.map((field) => ({
    ...field,
    options: field.options?.map((option) => ({ ...option })),
    ui: field.ui ? { ...field.ui } : undefined,
  })),
  validationRules: config.validationRules?.map((rule) => ({ ...rule })),
  security: config.security ? { ...config.security } : undefined,
  delivery: config.delivery
    ? {
        ...config.delivery,
        autoReply: config.delivery.autoReply
          ? { ...config.delivery.autoReply }
          : undefined,
        webhooks: config.delivery.webhooks?.map((webhook) => ({ ...webhook })),
      }
    : undefined,
});

export const toFormDefinitionResponseDTO = (
  model: FormConfig,
): FormDefinitionResponseDTO => {
  const config = cloneConfig(model);

  return {
    ...config,
    security: config.security
      ? {
          ...config.security,
          captcha: config.security.captcha ?? 'none',
        }
      : undefined,
  };
};

export const fromFormDefinitionResponseDTO = (
  dto: FormDefinitionResponseDTO,
): FormConfig => cloneConfig(dto);
