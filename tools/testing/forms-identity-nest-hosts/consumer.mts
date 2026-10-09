import assert from 'node:assert/strict';
import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FormsModule } from '@anarchitects/forms-nest';
import { FormsService } from '@anarchitects/forms-nest/application';
import { IdentityModule } from '@anarchitects/identity-nest';
import { UserProfilesRepository } from '@anarchitects/identity-nest/infrastructure-persistence';
import {
  CommonMailerModule,
  MailerPort,
  NoopMailerAdapter,
} from '@anarchitects/common-nest-mailer';
import { SubmissionRequestSchema } from '@anarchitects/forms-ts/dtos';
import { CreateUserProfileRequestSchema } from '@anarchitects/identity-ts/dtos';
import { identities } from './consumer.cjs';
for (const [name, value] of Object.entries({
  Module,
  FormsModule,
  FormsService,
  IdentityModule,
  UserProfilesRepository,
  MailerPort,
})) {
  assert.equal(value, identities[name as keyof typeof identities]);
}
assert.ok(SubmissionRequestSchema.properties.formId);
assert.ok(CreateUserProfileRequestSchema.properties.authUserId);
@Injectable()
class EsmConsumer {
  constructor(readonly mailer: MailerPort) {}
}
const context = await Test.createTestingModule({
  imports: [CommonMailerModule.forRoot({ provider: 'noop' })],
  providers: [EsmConsumer],
}).compile();
try {
  assert.ok(context.get(EsmConsumer).mailer instanceof NoopMailerAdapter);
} finally {
  await context.close();
}
console.log(
  'Native ESM package declarations and CJS/ESM DI identities passed.',
);
