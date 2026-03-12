import { Test } from '@nestjs/testing';
import {
  CommonMailerModule,
  MailerPort,
  NoopMailerAdapter,
  NodeMailerAdapter as SharedNodeMailerAdapter,
} from '@anarchitects/common-nest-mailer';
import { NestMailerAdapter } from './adapters/node-mailer.adapter';
import { FormsInfrastructureMailerModule } from './mailer.module';
import * as infrastructureMailerExports from './index';

const ORIGINAL_FORMS_MAILER_ENABLED = process.env['FORMS_MAILER_ENABLED'];

describe('FormsInfrastructureMailerModule', () => {
  afterEach(() => {
    if (ORIGINAL_FORMS_MAILER_ENABLED === undefined) {
      delete process.env['FORMS_MAILER_ENABLED'];
      return;
    }

    process.env['FORMS_MAILER_ENABLED'] = ORIGINAL_FORMS_MAILER_ENABLED;
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
        FormsInfrastructureMailerModule,
      ],
    }).compile();

    const adapter = moduleRef.get(MailerPort, { strict: false });
    expect(adapter).toBeDefined();
  });

  it('should expose domain NestMailerAdapter as shared implementation alias', () => {
    expect(NestMailerAdapter).toBe(SharedNodeMailerAdapter);
  });

  it('should expose the shared node adapter when enabled via forRoot options', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        CommonMailerModule.forRootAsync({
          useFactory: () => ({
            transport: { jsonTransport: true },
            defaults: { from: 'noreply@example.com' },
            template: { dir: 'templates' },
          }),
        }),
        FormsInfrastructureMailerModule.forRoot({
          features: { enabled: true },
        }),
      ],
    }).compile();

    const adapter = moduleRef.get(MailerPort, { strict: false });
    expect(adapter).toBeDefined();
  });

  it('should expose shared no-op adapter when disabled via forRoot options', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        FormsInfrastructureMailerModule.forRoot({
          features: { enabled: false },
        }),
      ],
    }).compile();

    const adapter = moduleRef.get(MailerPort, { strict: false });
    expect(adapter).toBeInstanceOf(NoopMailerAdapter);
  });

  it('should keep forRoot explicit and ignore env defaults', async () => {
    process.env['FORMS_MAILER_ENABLED'] = 'false';
    const moduleRef = await Test.createTestingModule({
      imports: [
        CommonMailerModule.forRootAsync({
          useFactory: () => ({
            transport: { jsonTransport: true },
            defaults: { from: 'noreply@example.com' },
            template: { dir: 'templates' },
          }),
        }),
        FormsInfrastructureMailerModule.forRoot(),
      ],
    }).compile();

    const adapter = moduleRef.get(MailerPort, { strict: false });
    expect(adapter).toBeDefined();
    expect(adapter).toBeInstanceOf(NestMailerAdapter);
  });

  it('should resolve env defaults through forRootFromConfig', async () => {
    process.env['FORMS_MAILER_ENABLED'] = 'false';
    const moduleRef = await Test.createTestingModule({
      imports: [FormsInfrastructureMailerModule.forRootFromConfig()],
    }).compile();

    const adapter = moduleRef.get(MailerPort, { strict: false });
    expect(adapter).toBeInstanceOf(NoopMailerAdapter);
  });

  it('should not export the removed domain-local MailerAdapter token', () => {
    expect(
      'MailerAdapter' in
        (infrastructureMailerExports as Record<string, unknown>),
    ).toBe(false);
  });
});
