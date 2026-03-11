import { Test } from '@nestjs/testing';
import {
  CommonMailerModule,
  MailerPort,
  NodeMailerAdapter as SharedNodeMailerAdapter,
} from '@anarchitects/common-nest-mailer';
import { NestMailerAdapter } from './adapters/node-mailer.adapter';
import { FormsInfrastructureMailerModule } from './mailer.module';
import * as infrastructureMailerExports from './index';

describe('FormsInfrastructureMailerModule', () => {
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

  it('should not export the removed domain-local MailerAdapter token', () => {
    expect(
      'MailerAdapter' in
        (infrastructureMailerExports as Record<string, unknown>),
    ).toBe(false);
  });
});
