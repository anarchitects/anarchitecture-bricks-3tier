import { Test } from '@nestjs/testing';
import {
  CommonMailerModule,
  MailerPort,
  NoopMailerAdapter,
  NodeMailerAdapter as SharedNodeMailerAdapter,
} from '@anarchitects/common-nest-mailer';
import { NodeMailerAdapter } from './adapters/node-mailer.adapter';
import { AuthMailerModule } from './mailer.module';
import * as infrastructureMailerExports from './index';

const ORIGINAL_AUTH_MAILER_ENABLED = process.env['AUTH_MAILER_ENABLED'];

describe('AuthMailerModule', () => {
  afterEach(() => {
    if (ORIGINAL_AUTH_MAILER_ENABLED === undefined) {
      delete process.env['AUTH_MAILER_ENABLED'];
      return;
    }

    process.env['AUTH_MAILER_ENABLED'] = ORIGINAL_AUTH_MAILER_ENABLED;
  });

  it('should compile and expose MailerPort', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        CommonMailerModule.forRootAsync({
          useFactory: () => ({
            transport: { jsonTransport: true },
            defaults: { from: 'noreply@example.com' },
            template: { dir: 'templates' },
          }),
        }),
        AuthMailerModule,
      ],
    }).compile();

    const adapter = moduleRef.get(MailerPort, { strict: false });
    expect(adapter).toBeDefined();
  });

  it('should expose domain NodeMailerAdapter as shared implementation alias', () => {
    expect(NodeMailerAdapter).toBe(SharedNodeMailerAdapter);
  });

  it('should expose shared no-op adapter when disabled via forRoot options', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        AuthMailerModule.forRoot({
          features: { enabled: false },
        }),
      ],
    }).compile();

    expect(moduleRef.get(MailerPort, { strict: false })).toBeInstanceOf(
      NoopMailerAdapter,
    );
  });

  it('should keep forRoot explicit and ignore AUTH_MAILER_ENABLED', async () => {
    process.env['AUTH_MAILER_ENABLED'] = 'false';

    const moduleRef = await Test.createTestingModule({
      imports: [
        CommonMailerModule.forRootAsync({
          useFactory: () => ({
            transport: { jsonTransport: true },
            defaults: { from: 'noreply@example.com' },
            template: { dir: 'templates' },
          }),
        }),
        AuthMailerModule.forRoot(),
      ],
    }).compile();

    expect(moduleRef.get(MailerPort, { strict: false })).toBeDefined();
  });

  it('should resolve AUTH_MAILER_ENABLED through forRootFromConfig', async () => {
    process.env['AUTH_MAILER_ENABLED'] = 'false';

    const moduleRef = await Test.createTestingModule({
      imports: [AuthMailerModule.forRootFromConfig()],
    }).compile();

    expect(moduleRef.get(MailerPort, { strict: false })).toBeInstanceOf(
      NoopMailerAdapter,
    );
  });

  it('should not export the removed domain-local MailerAdapter token', () => {
    expect(
      'MailerAdapter' in
        (infrastructureMailerExports as Record<string, unknown>),
    ).toBe(false);
  });
});
