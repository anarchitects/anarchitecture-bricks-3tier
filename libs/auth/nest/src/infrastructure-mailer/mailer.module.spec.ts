import { Test } from '@nestjs/testing';
import {
  CommonMailerModule,
  MailerPort,
} from '@anarchitects/common-nest-mailer';
import { AuthMailerModule } from './mailer.module';
import * as infrastructureMailerExports from './index';

describe('AuthMailerModule', () => {
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

  it('should not export the removed domain-local MailerAdapter token', () => {
    expect(
      'MailerAdapter' in (infrastructureMailerExports as Record<string, unknown>)
    ).toBe(false);
  });
});
