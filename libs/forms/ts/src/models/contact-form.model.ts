import type { FormConfig } from './form.types';

export const contactForm: FormConfig = {
  id: 'contact_default',
  version: 1,
  fields: [
    {
      name: 'name',
      kind: 'string',
      required: true,
      minLength: 2,
      maxLength: 100,
      ui: { label: 'Name' },
    },
    { name: 'email', kind: 'email', required: true, ui: { label: 'Email' } },
    {
      name: 'message',
      kind: 'textarea',
      required: true,
      minLength: 10,
      maxLength: 3000,
      ui: { label: 'Message', rows: 6 },
    },
    {
      name: 'consent',
      kind: 'boolean',
      required: true,
      ui: { label: 'I agree' },
    },
  ],
  security: { honeypot: 'website', captcha: 'none' },
  delivery: {
    adminEmail: 'admin@site.tld',
    subject: 'New contact form submission',
    templateId: 'contact',
    autoReply: {
      enabled: true,
      templateId: 'contact_autoreply',
      subject: 'Thank you for contacting us!',
    },
  },
};
