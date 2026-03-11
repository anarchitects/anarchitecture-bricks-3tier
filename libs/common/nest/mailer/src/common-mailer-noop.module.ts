import { Global, Module } from '@nestjs/common';
import { NoopMailerAdapter } from './adapters/noop-mailer.adapter';
import { MailerPort } from './ports/mailer.port';

@Global()
@Module({
  providers: [
    NoopMailerAdapter,
    {
      provide: MailerPort,
      useExisting: NoopMailerAdapter,
    },
  ],
  exports: [MailerPort],
})
export class CommonMailerNoopModule {}
