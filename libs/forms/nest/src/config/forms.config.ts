import { Inject } from '@nestjs/common';
import { ConfigType, registerAs } from '@nestjs/config';

const FORMS_CONFIG_KEY = 'forms';
export const DEFAULT_FORMS_PERSISTENCE = 'typeorm';
export const DEFAULT_FORMS_MAILER_ENABLED = true;

const parseMailerEnabled = (): boolean => {
  const value = process.env['FORMS_MAILER_ENABLED'];
  if (value === undefined) {
    return DEFAULT_FORMS_MAILER_ENABLED;
  }

  return value !== 'false';
};

export const formsConfig = registerAs(FORMS_CONFIG_KEY, () => ({
  persistence: process.env['FORMS_PERSISTENCE'] ?? DEFAULT_FORMS_PERSISTENCE,
  mailerEnabled: parseMailerEnabled(),
}));

export type FormsConfig = ConfigType<typeof formsConfig>;

export const InjectFormsConfig = () => Inject(formsConfig.KEY);
