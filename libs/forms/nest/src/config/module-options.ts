import {
  DEFAULT_FORMS_MAILER_PROVIDER,
  DEFAULT_FORMS_PERSISTENCE,
} from './forms.config';
import type { CommonMailerProvider } from '@anarchitects/common-nest-mailer';
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

export type FormsInfrastructureMailerModuleOptions = {
  provider?: CommonMailerProvider;
};

export type FormsModuleFeatures = {
  provider?: CommonMailerProvider;
};

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
  provider: config.mailerProvider ?? DEFAULT_FORMS_MAILER_PROVIDER,
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
