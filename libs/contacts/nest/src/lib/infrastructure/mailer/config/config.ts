import { Inject } from '@nestjs/common';
import { ConfigType, registerAs } from '@nestjs/config';

export const contactsMailerConfig = registerAs('contactsMailer', () => ({
  templateIn: process.env['CONTACTS_MAILER_TEMPLATE_IN'] ?? 'contact-in',
  templateOut: process.env['CONTACTS_MAILER_TEMPLATE_OUT'] ?? 'contact-out',
}));

export type ContactsMailerConfig = ConfigType<typeof contactsMailerConfig>;

export const InjectContactsMailerConfig = () =>
  Inject(contactsMailerConfig.KEY);
