import 'reflect-metadata';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Injectable, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MAILER_OPTIONS, MailerService } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import {
  CommonMailerModule,
  InjectMailerConfig,
  MailerPort,
  NoopMailerAdapter,
  NodeMailerAdapter,
  mailerConfig,
  type MailerConfig,
  type MailerMessage,
} from '@anarchitects/common-nest-mailer';
import type Mail from 'nodemailer/lib/mailer';
import type MailMessage from 'nodemailer/lib/mailer/mail-message';
import type { SentMessageInfo, Transport } from 'nodemailer';

@Injectable()
class Consumer {
  constructor(readonly mailer: MailerPort) {}
}

@Injectable()
class ConfigConsumer {
  constructor(@InjectMailerConfig() readonly config: MailerConfig) {}
}

// Compiles the public contract without skipLibCheck or workspace aliases.
const message: MailerMessage = {
  to: 'recipient@example.test',
  subject: 'Host message',
  html: '<p>Hello</p>',
  text: 'Hello',
  replyTo: 'help@example.test',
  headers: { 'X-Consumer': 'isolated' },
};
// @ts-expect-error A rendered message must provide at least one body.
const invalidMessage: MailerMessage = {
  to: 'recipient@example.test',
  subject: 'Invalid',
};
void invalidMessage;

class CaptureTransport implements Transport {
  name = 'isolated-host';
  version = '1.0.0';
  messages: Mail.Options[] = [];
  failure?: Error;
  closed = false;

  send(
    mail: MailMessage,
    callback: (err: Error | null, info?: SentMessageInfo) => void,
  ) {
    if (this.failure) {
      callback(this.failure);
      return;
    }
    this.messages.push(mail.data);
    callback(null, { messageId: 'isolated-host-message' });
  }

  close() {
    this.closed = true;
  }
}

export const frameworkIdentity = { Module, Test };
export const packageIdentity = { MailerPort, CommonMailerModule };

export async function runConsumer() {
  const base = resolve('host-artifact');
  const templateDir = resolve(base, 'templates');
  mkdirSync(templateDir, { recursive: true });
  writeFileSync(resolve(templateDir, 'hello.hbs'), '<p>Hello {{name}}</p>');
  // The noop path needs no configured transport or template directory.
  process.env['MAILER_PROVIDER'] = 'node';
  const noop = await Test.createTestingModule({
    imports: [CommonMailerModule.forRoot({ provider: 'noop' })],
    providers: [Consumer],
  }).compile();
  try {
    const port = noop.get(Consumer).mailer;
    assert.ok(port instanceof NoopMailerAdapter);
    assert.equal(await port.sendMessage(message), undefined);
    await port.send('recipient@example.test', 'noop', '<p>No delivery</p>');
    await port.sendTemplate('recipient@example.test', 'noop', 'missing', {});
    assert.throws(() => noop.get(MailerService));
  } finally {
    await noop.close();
  }

  process.env['MAILER_PROVIDER'] = 'noop';
  const configuredNoop = await Test.createTestingModule({
    imports: [CommonMailerModule.forProviderFromConfig()],
  }).compile();
  try {
    assert.ok(configuredNoop.get(MailerPort) instanceof NoopMailerAdapter);
  } finally {
    await configuredNoop.close();
  }

  const transport = new CaptureTransport();
  const node = await Test.createTestingModule({
    imports: [
      CommonMailerModule.forRootAsync({
        useFactory: () => ({
          transport,
          defaults: { from: 'default@example.test' },
          template: { dir: templateDir, adapter: new HandlebarsAdapter() },
        }),
      }),
      // Explicit override must win over MAILER_PROVIDER=noop.
      CommonMailerModule.forProviderFromConfig({ provider: 'node' }),
    ],
    providers: [Consumer],
  }).compile();
  try {
    await node.init();
    const port = node.get(Consumer).mailer;
    assert.ok(port instanceof NodeMailerAdapter);
    assert.equal(await port.sendMessage(message), undefined);
    assert.equal(transport.messages.length, 1);
    const delivered = transport.messages[0];
    assert.equal(delivered.from, 'default@example.test');
    assert.equal(delivered.to, message.to);
    assert.equal(delivered.subject, message.subject);
    assert.equal(delivered.html, message.html);
    assert.equal(delivered.text, message.text);
    assert.equal(delivered.replyTo, message.replyTo);
    assert.deepEqual(delivered.headers, message.headers);
    await port.sendMessage({ ...message, from: 'override@example.test' });
    assert.equal(transport.messages[1].from, 'override@example.test');
    await port.send('recipient@example.test', 'Legacy send', '<p>Legacy</p>');
    assert.equal(transport.messages[2].html, '<p>Legacy</p>');
    await port.sendTemplate(message.to, 'Legacy template', 'hello', {
      name: 'legacy',
    });
    assert.match(String(transport.messages[3].html), /Hello legacy/);
    const failure = new Error('deliberate transport rejection');
    transport.failure = failure;
    await assert.rejects(
      port.sendMessage(message),
      (error) => error === failure,
    );
    assert.equal(transport.messages.length, 4);
  } finally {
    await node.close();
  }
  assert.equal(transport.closed, true);

  // Real Handlebars rendering through the configured adapter. No SMTP traffic.
  process.env['MAILER_TEMPLATE_BASE_DIR'] = base;
  process.env['MAILER_TEMPLATE_DIR'] = 'templates';
  process.env['MAILER_PROVIDER'] = 'node';
  process.env['MAILER_HOST'] = 'localhost';
  process.env['MAILER_DEFAULT'] = 'templates@example.test';

  const templates = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ ignoreEnvFile: true, load: [mailerConfig] }),
      CommonMailerModule.forRootFromConfig(),
      CommonMailerModule.forRoot({ provider: 'node' }),
    ],
    providers: [ConfigConsumer],
  }).compile();
  try {
    assert.equal(templates.get(ConfigConsumer).config.host, 'localhost');
    assert.equal(templates.get(MAILER_OPTIONS).template.dir, templateDir);
    const mailer = templates.get(MailerService);
    // Replace only the transport, preserving the real config-driven template adapter.
    mailer.addTransporter('fixture', { jsonTransport: true });
    const result = await mailer.sendMail({
      transporterName: 'fixture',
      to: message.to,
      subject: 'Template',
      template: 'hello',
      context: { name: 'consumer' },
    });
    assert.match(JSON.parse(result.message.toString()).html, /Hello consumer/);
  } finally {
    await templates.close();
    rmSync(base, { recursive: true, force: true });
  }

  process.env['MAILER_TEMPLATE_DIR'] = 'missing-directory';
  await assert.rejects(
    Test.createTestingModule({
      imports: [CommonMailerModule.forRootFromConfig()],
    }).compile(),
    /Invalid mailer template directory/,
  );
  console.log(
    'Common Mailer: DI, node/noop, config precedence, templates, dispatch, rejection and shutdown passed',
  );
}
