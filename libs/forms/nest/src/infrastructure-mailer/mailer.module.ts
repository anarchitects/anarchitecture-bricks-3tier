import { Global, Module } from '@nestjs/common';
import { MailerPort } from '@anarchitects/common-nest-mailer';
import { NestMailerAdapter } from './adapters/node-mailer.adapter';

@Global()
@Module({
  providers: [
    NestMailerAdapter,
    {
      provide: MailerPort,
      useExisting: NestMailerAdapter,
    },
  ],
  exports: [MailerPort],
})
export class FormsInfrastructureMailerModule {}
