import {
  MAILER_OPTIONS,
  MailerOptions,
  MailerService,
} from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { NodeMailerAdapter } from './adapters/node-mailer.adapter';
import { NoopMailerAdapter } from './adapters/noop-mailer.adapter';
import { CommonMailerModule } from './common-mailer.module';
import { MailerConfig, mailerConfig } from './config/mailer.config';
import { MailerPort } from './ports/mailer.port';
import * as commonMailerExports from './index';

describe('CommonMailerModule', () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), 'mailer-module-'));
    mkdirSync(join(baseDir, 'mail', 'templates'), { recursive: true });
    mkdirSync(join(baseDir, 'unused'));
    jest.replaceProperty(process, 'env', { ...process.env });
    process.env['MAILER_PROVIDER'] = 'node';
    process.env['MAILER_TEMPLATE_DIR'] = 'mail/templates';
    process.env['MAILER_TEMPLATE_BASE_DIR'] = baseDir;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    rmSync(baseDir, { recursive: true, force: true });
  });

  it('compiles using forRootFromConfig', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [mailerConfig],
        }),
        CommonMailerModule.forRootFromConfig(),
      ],
    }).compile();

    try {
      expect(moduleRef.get(MailerService, { strict: false })).toBeDefined();
    } finally {
      await moduleRef.close();
    }
  });

  describe.each(['environment', 'injected config'] as const)(
    'template paths from %s',
    (source) => {
      beforeEach(() => {
        delete process.env['MAILER_TEMPLATE_DIR'];
        delete process.env['MAILER_TEMPLATE_BASE_DIR'];
      });

      it.each(['explicit base', 'omitted base', 'empty base', 'absolute path'])(
        '%s',
        async (scenario) => {
          const absoluteDir = `${baseDir}${sep}unused${sep}..${sep}mail${sep}templates${sep}`;
          const usesCwd =
            scenario === 'omitted base' || scenario === 'empty base';
          const templateBaseDir =
            scenario === 'omitted base'
              ? undefined
              : scenario === 'empty base'
                ? ''
                : baseDir;
          const templateDir =
            scenario === 'absolute path'
              ? absoluteDir
              : usesCwd
                ? relative(process.cwd(), join(baseDir, 'mail', 'templates'))
                : 'mail/templates';
          const expected =
            scenario === 'absolute path'
              ? absoluteDir
              : join(baseDir, 'mail', 'templates');
          const builder = Test.createTestingModule({
            imports: [CommonMailerModule.forRootFromConfig()],
          });

          if (source === 'environment') {
            process.env['MAILER_TEMPLATE_DIR'] = templateDir;
            if (templateBaseDir !== undefined) {
              process.env['MAILER_TEMPLATE_BASE_DIR'] = templateBaseDir;
            }
          } else {
            const config: MailerConfig = {
              provider: 'node',
              host: 'localhost',
              port: 2525,
              secure: false,
              user: 'user',
              pass: 'password',
              default: 'noreply@example.com',
              ignoreTLS: true,
              templateDir,
              ...(templateBaseDir === undefined ? {} : { templateBaseDir }),
            };
            builder.overrideProvider(mailerConfig.KEY).useValue(config);
          }

          const moduleRef = await builder.compile();
          try {
            const options = moduleRef.get<MailerOptions>(MAILER_OPTIONS);

            expect(options.template?.dir).toBe(expected);
            expect(options.template?.adapter).toBeInstanceOf(HandlebarsAdapter);
            expect(moduleRef.get(MailerService)).toBeDefined();
          } finally {
            await moduleRef.close();
          }
        },
      );

      it.each(['missing', 'file'])(
        'rejects a %s template directory before sending mail',
        async (kind) => {
          const templateDir = 'invalid-templates';
          const resolvedDir = join(baseDir, templateDir);
          if (kind === 'file') {
            writeFileSync(resolvedDir, 'not a directory');
          }

          process.env['MAILER_TEMPLATE_DIR'] = templateDir;
          process.env['MAILER_TEMPLATE_BASE_DIR'] = baseDir;
          process.env['MAILER_PASS'] = 'smtp-secret-must-not-appear';
          const sendMail = jest.spyOn(MailerService.prototype, 'sendMail');
          const builder = Test.createTestingModule({
            imports: [CommonMailerModule.forRootFromConfig()],
          });
          if (source === 'injected config') {
            builder.overrideProvider(mailerConfig.KEY).useValue(mailerConfig());
          }

          await expect(builder.compile()).rejects.toThrow(
            new Error(
              `Invalid mailer template directory "${resolvedDir}": ${
                kind === 'file'
                  ? 'path is not a directory.'
                  : 'path does not exist or cannot be accessed.'
              }`,
            ),
          );
          expect(sendMail).not.toHaveBeenCalled();
        },
      );
    },
  );

  it('preserves custom upstream options using forRootAsync', async () => {
    const options: MailerOptions = {
      transport: { jsonTransport: true },
      defaults: { from: 'noreply@example.com' },
      template: { dir: 'templates' },
    };
    const moduleRef = await Test.createTestingModule({
      imports: [
        CommonMailerModule.forRootAsync({
          useFactory: () => options,
        }),
      ],
    }).compile();

    try {
      expect(moduleRef.get(MailerService, { strict: false })).toBeDefined();
      expect(moduleRef.get<MailerOptions>(MAILER_OPTIONS)).toBe(options);
    } finally {
      await moduleRef.close();
    }
  });

  it('wires node provider by default with forRoot', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        CommonMailerModule.forRootAsync({
          useFactory: () => ({
            transport: { jsonTransport: true },
            defaults: { from: 'noreply@example.com' },
            template: { dir: 'templates' },
          }),
        }),
        CommonMailerModule.forRoot(),
      ],
    }).compile();

    expect(moduleRef.get(MailerPort, { strict: false })).toBeInstanceOf(
      NodeMailerAdapter,
    );
  });

  it('wires noop provider with forRoot', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CommonMailerModule.forRoot({ provider: 'noop' })],
    }).compile();

    expect(moduleRef.get(MailerPort, { strict: false })).toBeInstanceOf(
      NoopMailerAdapter,
    );
  });

  it('delivers structured messages through node wiring and preserves host sender defaults', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        CommonMailerModule.forRootAsync({
          useFactory: () => ({
            transport: { jsonTransport: true },
            defaults: { from: 'Host <default@example.test>' },
          }),
        }),
        CommonMailerModule.forRoot({ provider: 'node' }),
      ],
    }).compile();
    try {
      const transport = jest.spyOn(moduleRef.get(MailerService), 'sendMail');
      const mailer = moduleRef.get(MailerPort);
      const content = {
        to: 'reader@example.test',
        subject: 'Requested message',
        html: '<p>Hello</p>',
        text: 'Hello',
        replyTo: 'help@example.test',
        headers: { 'X-Application': 'host' },
      };
      await expect(mailer.sendMessage(content)).resolves.toBeUndefined();
      const first = JSON.parse((await transport.mock.results[0].value).message);
      expect(first).toMatchObject({
        subject: content.subject,
        html: content.html,
        text: content.text,
        from: { name: 'Host', address: 'default@example.test' },
        replyTo: [{ address: 'help@example.test' }],
        headers: content.headers,
      });
      await mailer.sendMessage({
        ...content,
        from: 'Override <sender@example.test>',
      });
      const second = JSON.parse(
        (await transport.mock.results[1].value).message,
      );
      expect(second.from).toEqual({
        name: 'Override',
        address: 'sender@example.test',
      });
    } finally {
      await moduleRef.close();
    }
  });

  it('throws when provider is unsupported via forRoot', () => {
    expect(() =>
      CommonMailerModule.forRoot({
        provider: 'unsupported' as 'node',
      }),
    ).toThrow('Unsupported mailer provider: unsupported');
  });

  it('resolves provider from env via forProviderFromConfig', async () => {
    process.env['MAILER_PROVIDER'] = 'noop';
    const moduleRef = await Test.createTestingModule({
      imports: [CommonMailerModule.forProviderFromConfig()],
    }).compile();

    expect(moduleRef.get(MailerPort, { strict: false })).toBeInstanceOf(
      NoopMailerAdapter,
    );
  });

  it('lets forProviderFromConfig overrides win over env defaults', async () => {
    process.env['MAILER_PROVIDER'] = 'noop';
    const moduleRef = await Test.createTestingModule({
      imports: [
        CommonMailerModule.forRootAsync({
          useFactory: () => ({
            transport: { jsonTransport: true },
            defaults: { from: 'noreply@example.com' },
            template: { dir: 'templates' },
          }),
        }),
        CommonMailerModule.forProviderFromConfig({
          provider: 'node',
        }),
      ],
    }).compile();

    expect(moduleRef.get(MailerPort, { strict: false })).toBeInstanceOf(
      NodeMailerAdapter,
    );
  });

  it('does not export removed split provider modules', () => {
    expect(
      'CommonNodeMailerModule' in
        (commonMailerExports as Record<string, unknown>),
    ).toBe(false);
    expect(
      'CommonMailerNoopModule' in
        (commonMailerExports as Record<string, unknown>),
    ).toBe(false);
  });

  it('throws when MAILER_PROVIDER is unsupported', () => {
    process.env['MAILER_PROVIDER'] = 'unsupported';

    expect(() => CommonMailerModule.forProviderFromConfig()).toThrow(
      'Unsupported mailer provider: unsupported',
    );
  });
});
