import {
  DEFAULT_FORMS_MAILER_ENABLED,
  DEFAULT_FORMS_PERSISTENCE,
} from './forms.config';
import type { FormsConfig } from './forms.config';

export type FormsInfrastructurePersistenceModuleOptions = {
  persistence: string;
};

export type FormsApplicationModuleOptions = {
  persistence?: FormsInfrastructurePersistenceModuleOptions;
};

export type FormsPresentationModuleOptions = {
  application?: FormsApplicationModuleOptions;
};

export type FormsInfrastructureMailerModuleFeatures = {
  enabled?: boolean;
};

export type FormsInfrastructureMailerModuleOptions = {
  features?: FormsInfrastructureMailerModuleFeatures;
};

export type FormsModuleFeatures = FormsInfrastructureMailerModuleFeatures;

export type FormsModuleOptions = {
  presentation?: FormsPresentationModuleOptions;
  mailer?: FormsInfrastructureMailerModuleOptions;
};

export const mapFormsConfigToPersistenceModuleOptions = (
  config: FormsConfig,
): FormsInfrastructurePersistenceModuleOptions => ({
  persistence: config.persistence ?? DEFAULT_FORMS_PERSISTENCE,
});

export const mapFormsConfigToMailerModuleOptions = (
  config: FormsConfig,
): FormsInfrastructureMailerModuleOptions => ({
  features: {
    enabled: config.mailerEnabled ?? DEFAULT_FORMS_MAILER_ENABLED,
  },
});

export const mapFormsConfigToApplicationModuleOptions = (
  config: FormsConfig,
): FormsApplicationModuleOptions => ({
  persistence: mapFormsConfigToPersistenceModuleOptions(config),
});

export const mapFormsConfigToPresentationModuleOptions = (
  config: FormsConfig,
): FormsPresentationModuleOptions => ({
  application: mapFormsConfigToApplicationModuleOptions(config),
});

export const mapFormsConfigToFormsModuleOptions = (
  config: FormsConfig,
): FormsModuleOptions => ({
  presentation: mapFormsConfigToPresentationModuleOptions(config),
  mailer: mapFormsConfigToMailerModuleOptions(config),
});
