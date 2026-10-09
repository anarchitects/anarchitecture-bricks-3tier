import assert from 'node:assert/strict';
import { Module } from '@nestjs/common';
import { NewsletterModule } from '@anarchitects/newsletter-nest';
import { NewsletterSubscriptionService } from '@anarchitects/newsletter-nest/application';
import { NewsletterPresentationModule } from '@anarchitects/newsletter-nest/presentation';
import { MailerPort } from '@anarchitects/common-nest-mailer';
import { NewsletterSubscriptionRequestSchema } from '@anarchitects/newsletter-ts/dtos';
import { identities } from './consumer.cjs';
for (const [name, value] of Object.entries({
  Module,
  NewsletterModule,
  NewsletterSubscriptionService,
  NewsletterPresentationModule,
  MailerPort,
})) {
  assert.equal(value, identities[name as keyof typeof identities]);
}
assert.equal(NewsletterSubscriptionRequestSchema.type, 'object');
console.log(
  'Newsletter CJS/ESM declarations, package loading and DI token identities passed.',
);
