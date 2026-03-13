import { Inject } from '@nestjs/common';
import { ConfigType, registerAs } from '@nestjs/config';
import type { CommonMailerProvider } from '@anarchitects/common-nest-mailer';

const FORMS_CONFIG_KEY = 'forms';
export const DEFAULT_FORMS_PERSISTENCE = 'typeorm';
export const DEFAULT_FORMS_MAILER_PROVIDER = 'node';

const parseMailerProvider = (): CommonMailerProvider => {
  const value = process.env['FORMS_MAILER_PROVIDER'];
  if (value === undefined) {
    return DEFAULT_FORMS_MAILER_PROVIDER;
  }

  switch (value) {
    case 'node':
    case 'noop':
      return value;
    default:
      throw new Error(`Unsupported mailer provider: ${value}`);
  }
};

export const formsConfig = registerAs(FORMS_CONFIG_KEY, () => ({
  persistence: process.env['FORMS_PERSISTENCE'] ?? DEFAULT_FORMS_PERSISTENCE,
  mailerProvider: parseMailerProvider(),
}));

export type FormsConfig = ConfigType<typeof formsConfig>;

export const InjectFormsConfig = () => Inject(formsConfig.KEY);
