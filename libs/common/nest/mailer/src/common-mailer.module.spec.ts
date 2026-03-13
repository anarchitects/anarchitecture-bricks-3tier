import { MailerService } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { NodeMailerAdapter } from './adapters/node-mailer.adapter';
import { NoopMailerAdapter } from './adapters/noop-mailer.adapter';
import { CommonMailerModule } from './common-mailer.module';
import { mailerConfig } from './config/mailer.config';
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

  it('compiles using forRootAsync', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        CommonMailerModule.forRootAsync({
          useFactory: () => ({
            transport: { jsonTransport: true },
            defaults: { from: 'noreply@example.com' },
            template: { dir: 'templates' },
          }),
        }),
      ],
    }).compile();

    expect(moduleRef.get(MailerService, { strict: false })).toBeDefined();
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
