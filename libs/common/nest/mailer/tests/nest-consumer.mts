import assert from 'node:assert/strict';
import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  CommonMailerModule,
  MailerPort,
  NoopMailerAdapter,
} from '@anarchitects/common-nest-mailer';
import {
  frameworkIdentity,
  packageIdentity,
  runConsumer,
} from './nest-consumer.cjs';

assert.equal(Module, frameworkIdentity.Module);
assert.equal(Test, frameworkIdentity.Test);
assert.equal(CommonMailerModule, packageIdentity.CommonMailerModule);
assert.equal(MailerPort, packageIdentity.MailerPort);

@Injectable()
class EsmConsumer {
  constructor(readonly mailer: MailerPort) {}
}
const app = await Test.createTestingModule({
  imports: [CommonMailerModule.forRoot({ provider: 'noop' })],
  providers: [EsmConsumer],
}).compile();
try {
  assert.ok(app.get(EsmConsumer).mailer instanceof NoopMailerAdapter);
} finally {
  await app.close();
}
await runConsumer();
