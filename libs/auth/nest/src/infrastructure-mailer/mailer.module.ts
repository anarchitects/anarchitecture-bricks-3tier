import { Global, Module } from '@nestjs/common';
import { MailerPort } from '@anarchitects/common-nest-mailer';
import { NodeMailerAdapter } from './adapters/node-mailer.adapter';

@Global()
@Module({
  providers: [
    NodeMailerAdapter,
    {
      provide: MailerPort,
      useExisting: NodeMailerAdapter,
    },
  ],
  exports: [MailerPort],
})
export class AuthMailerModule {}
