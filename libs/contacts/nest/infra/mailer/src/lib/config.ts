import { Inject } from '@nestjs/common';
import { ConfigType, registerAs } from '@nestjs/config';

export const contactsMailerConfig = registerAs('contactsMailer', () => ({
  templateIn: process.env['CONTACTS_MAILER_TEMPLATE_IN'] ?? 'default',
  templateOut: process.env['CONTACTS_MAILER_TEMPLATE_OUT'] ?? 'html',
}));

export type ContactsMailerConfig = ConfigType<typeof contactsMailerConfig>;

export const InjectContactsMailerConfig = () =>
  Inject(contactsMailerConfig.KEY);
