import { MailerService } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { CommonMailerNoopModule } from './common-mailer-noop.module';
import { CommonNodeMailerModule } from './common-node-mailer.module';
import { NodeMailerAdapter } from './adapters/node-mailer.adapter';
import { NoopMailerAdapter } from './adapters/noop-mailer.adapter';
import { CommonMailerModule } from './common-mailer.module';
import { mailerConfig } from './config/mailer.config';
import { MailerPort } from './ports/mailer.port';

describe('CommonMailerModule', () => {
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

  it('compiles noop module and exposes shared MailerPort', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CommonMailerNoopModule],
    }).compile();

    expect(moduleRef.get(MailerPort, { strict: false })).toBeInstanceOf(
      NoopMailerAdapter,
    );
  });

  it('compiles common node module and exposes shared MailerPort', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        CommonMailerModule.forRootAsync({
          useFactory: () => ({
            transport: { jsonTransport: true },
            defaults: { from: 'noreply@example.com' },
            template: { dir: 'templates' },
          }),
        }),
        CommonNodeMailerModule,
      ],
    }).compile();

    expect(moduleRef.get(MailerPort, { strict: false })).toBeInstanceOf(
      NodeMailerAdapter,
    );
  });
});
