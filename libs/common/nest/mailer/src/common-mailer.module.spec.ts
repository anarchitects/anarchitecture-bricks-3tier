import {
  MAILER_OPTIONS,
  MailerOptions,
  MailerService,
} from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { join, parse, sep } from 'node:path';
import { NodeMailerAdapter } from './adapters/node-mailer.adapter';
import { NoopMailerAdapter } from './adapters/noop-mailer.adapter';
import { CommonMailerModule } from './common-mailer.module';
import { MailerConfig, mailerConfig } from './config/mailer.config';
import { MailerPort } from './ports/mailer.port';
import * as commonMailerExports from './index';

const ORIGINAL_MAILER_PROVIDER = process.env['MAILER_PROVIDER'];

describe('CommonMailerModule', () => {
  afterEach(() => {
    if (ORIGINAL_MAILER_PROVIDER === undefined) {
      delete process.env['MAILER_PROVIDER'];
      return;
    }

    process.env['MAILER_PROVIDER'] = ORIGINAL_MAILER_PROVIDER;
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

    expect(moduleRef.get(MailerService, { strict: false })).toBeDefined();
  });

  describe.each(['environment', 'injected config'] as const)(
    'template paths from %s',
    (source) => {
      const baseDir = join(parse(process.cwd()).root, 'deployment');
      const absoluteDir = `${baseDir}${sep}unused${sep}..${sep}templates${sep}`;

      beforeEach(() => {
        jest.replaceProperty(process, 'env', { ...process.env });
        process.env['MAILER_PROVIDER'] = 'node';
        delete process.env['MAILER_TEMPLATE_DIR'];
        delete process.env['MAILER_TEMPLATE_BASE_DIR'];
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it.each([
        {
          name: 'explicit base directory',
          templateDir: 'mail/templates',
          templateBaseDir: baseDir,
          expected: join(baseDir, 'mail', 'templates'),
        },
        {
          name: 'cwd fallback without a base directory',
          templateDir: 'mail/templates',
          templateBaseDir: undefined,
          expected: join(process.cwd(), 'mail', 'templates'),
        },
        {
          name: 'cwd fallback with an empty base directory',
          templateDir: 'mail/templates',
          templateBaseDir: '',
          expected: join(process.cwd(), 'mail', 'templates'),
        },
        {
          name: 'absolute path passthrough',
          templateDir: absoluteDir,
          templateBaseDir: baseDir,
          expected: absoluteDir,
        },
      ])('$name', async ({ templateDir, templateBaseDir, expected }) => {
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
      });
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
