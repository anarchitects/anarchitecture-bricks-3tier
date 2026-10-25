import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import { createServer, type Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Test } from '@nestjs/testing';
import { MailerService } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import {
  CommonMailerModule,
  MailerPort,
} from '@anarchitects/common-nest-mailer';

// A loopback SMTP sink exercises actual MIME/envelope generation and SMTP errors.
// It never relays messages or connects to an external mail server.
export async function runMailSecurity() {
  const messages: string[] = [];
  const recipients: string[] = [];
  const senders: string[] = [];
  const sockets = new Set<Socket>();
  const smtp = createServer((socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.setTimeout(5000, () => socket.destroy());
    let pending = '';
    let data: string[] | undefined;
    socket.write('220 localhost test SMTP\r\n');
    socket.on('data', (chunk) => {
      pending += chunk.toString();
      let end: number;
      while ((end = pending.indexOf('\r\n')) !== -1) {
        const line = pending.slice(0, end);
        pending = pending.slice(end + 2);
        if (data) {
          if (line === '.') {
            messages.push(data.join('\r\n'));
            data = undefined;
            socket.write('250 queued\r\n');
          } else data.push(line.replace(/^\.\./, '.'));
        } else if (/^EHLO |^HELO /.test(line)) {
          socket.write('250 localhost\r\n');
        } else if (line.startsWith('MAIL FROM:')) {
          senders.push(line);
          socket.write('250 sender accepted\r\n');
        } else if (line.startsWith('RCPT TO:')) {
          recipients.push(line);
          socket.write(
            line.includes('denied@example.test')
              ? '550 denied\r\n'
              : '250 accepted\r\n',
          );
        } else if (line === 'DATA') {
          data = [];
          socket.write('354 send message\r\n');
        } else if (line === 'QUIT') {
          socket.end('221 bye\r\n');
        } else if (line === 'RSET') {
          socket.write('250 reset\r\n');
        } else socket.write('500 unsupported\r\n');
      }
    });
  });
  let requests = 0;
  const http = createHttpServer((_req, res) => {
    requests++;
    res.end('PRIVATE URL CONTENT');
  });
  const directory = mkdtempSync(join(tmpdir(), 'mailer-security-'));
  const templates = join(directory, 'templates');
  mkdirSync(templates);
  writeFileSync(join(directory, 'secret.txt'), 'PRIVATE FILE CONTENT');
  writeFileSync(join(templates, 'contact.hbs'), '<p>{{name}}</p>');
  smtp.listen(0, '127.0.0.1');
  await once(smtp, 'listening');
  http.listen(0, '127.0.0.1');
  await once(http, 'listening');
  const smtpAddress = smtp.address();
  const httpAddress = http.address();
  assert.ok(smtpAddress && typeof smtpAddress === 'object');
  assert.ok(httpAddress && typeof httpAddress === 'object');
  const url = `http://127.0.0.1:${httpAddress.port}/private`;
  let moduleRef:
    | Awaited<
        ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
      >
    | undefined;
  try {
    moduleRef = await Test.createTestingModule({
      imports: [
        CommonMailerModule.forRootAsync({
          useFactory: () => ({
            transport: {
              host: '127.0.0.1',
              port: smtpAddress.port,
              ignoreTLS: true,
              connectionTimeout: 3000,
              socketTimeout: 3000,
              disableFileAccess: true,
              disableUrlAccess: true,
            },
            defaults: { from: 'Host <sender@example.test>' },
            template: { dir: templates, adapter: new HandlebarsAdapter() },
          }),
        }),
        CommonMailerModule.forRoot({ provider: 'node' }),
      ],
    }).compile();
    await moduleRef.init();
    const port = moduleRef.get(MailerPort);
    const service = moduleRef.get(MailerService);
    await port.sendMessage({
      to: 'reader@example.test',
      subject: 'Multipart',
      text: 'Plain body',
      html: '<p>HTML body</p>',
      replyTo: 'reply@example.test',
      headers: { 'X-Test': 'captured' },
    });
    assert.match(messages[0], /multipart\/alternative/);
    assert.match(messages[0], /Plain body/);
    assert.match(messages[0], /HTML body/);
    assert.match(messages[0], /Reply-To: reply@example.test/);
    assert.match(messages[0], /X-Test: captured/);
    assert.equal(senders[0], 'MAIL FROM:<sender@example.test>');
    await port.send('reader@example.test', 'Legacy HTML', '<p>Legacy</p>');
    const hostile = `<script>alert(1)</script><link rel="stylesheet" href="${url}">`;
    await port.sendTemplate('reader@example.test', 'Escaping', 'contact', {
      name: hostile,
    });
    // Nodemailer's quoted-printable wrapping is removed for content assertions.
    const templateMessage = messages.at(-1);
    assert.ok(templateMessage);
    const rendered = templateMessage.replace(/=\r\n/g, '').replace(/=3D/g, '=');
    assert.match(rendered, /&lt;script&gt;/);
    assert.doesNotMatch(rendered, /<script>|<link /);
    await assert.rejects(
      port.sendTemplate('reader@example.test', 'Missing', 'missing', {}),
      /ENOENT/,
    );

    // Attachments are an existing advanced MailerService capability, not a new MailerPort API.
    await service.sendMail({
      to: 'reader@example.test',
      subject: 'Attachment',
      text: 'Attached',
      html: '<p>Attached</p>',
      attachments: [
        { filename: 'hello.txt', content: Buffer.from('SAFE ATTACHMENT') },
      ],
    });
    const attachmentMessage = messages.at(-1);
    assert.ok(attachmentMessage);
    assert.match(attachmentMessage, /filename=hello.txt/);
    assert.match(
      attachmentMessage,
      new RegExp(Buffer.from('SAFE ATTACHMENT').toString('base64')),
    );

    // Regressions for the three 2026-10-19 address-parser advisories, through real SMTP.
    for (const [to, expected] of [
      [
        'Reader (x(y) <evil@attacker.test>) <reader@example.test>',
        'reader@example.test',
      ],
      [
        'Group: (a; <evil@attacker.test>) <reader@example.test>;',
        'reader@example.test',
      ],
      // SMTP command sanitization replaces the embedded angle bracket with a
      // space; the security invariant is retaining the intended example.test domain.
      ['<"a@attacker.test>"@example.test>', '"a@attacker.test "@example.test'],
    ]) {
      const before = recipients.length;
      await port.send(to, 'Address regression', '<p>Private</p>');
      assert.deepEqual(recipients.slice(before), [`RCPT TO:<${expected}>`]);
    }
    await port.sendMessage({
      to: 'reader@example.test',
      subject: 'Sender regression',
      text: 'Body',
      html: '<p>Body</p>',
      from: 'Sender (x(y) <evil@attacker.test>) <sender@example.test>',
    });
    assert.equal(senders.at(-1), 'MAIL FROM:<sender@example.test>');
    const delivered = messages.length;
    await assert.rejects(
      port.send('', 'Empty recipient', 'body'),
      /recipient/i,
    );
    await assert.rejects(
      port.send('denied@example.test', 'SMTP rejection', 'body'),
      /denied|550/i,
    );
    assert.equal(messages.length, delivered);

    // Both raw messages and attachment content must honor transport-level restrictions,
    // even when per-message options try to relax them (older Nodemailer bypassed these).
    for (const path of [join(directory, 'secret.txt'), url]) {
      for (const payload of [
        { raw: { path } },
        { attachments: [{ filename: 'secret.txt', path }] },
      ]) {
        await assert.rejects(
          service.sendMail({
            to: 'reader@example.test',
            subject: 'Blocked access',
            text: 'Body',
            html: '<p>Body</p>',
            disableFileAccess: false,
            disableUrlAccess: false,
            // Deliberately emulate untyped hostile input; upstream's public raw
            // type is narrower than the runtime content resolver being tested.
            ...(payload as unknown as Parameters<MailerService['sendMail']>[0]),
          }),
          /access.*rejected|not allowed|disabled/i,
        );
      }
    }
    assert.equal(requests, 0, 'No URL fetch may reach the loopback sentinel');
    assert.equal(
      messages.length,
      delivered,
      'Blocked messages must not be delivered',
    );
    assert.ok(messages.every((mail) => !mail.includes('PRIVATE FILE CONTENT')));
    console.log(
      'Security: captured SMTP, MIME, attachments, escaped templates, address parsing, access restrictions and rejection passed',
    );
  } finally {
    await moduleRef?.close();
    for (const socket of sockets) socket.destroy();
    await Promise.all([
      new Promise<void>((resolve) => smtp.close(() => resolve())),
      new Promise<void>((resolve) => http.close(() => resolve())),
    ]);
    rmSync(directory, { recursive: true, force: true });
  }
}
