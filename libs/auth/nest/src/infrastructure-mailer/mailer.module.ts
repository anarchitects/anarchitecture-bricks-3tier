import { Module } from '@nestjs/common';
import { MailerAdapter } from './adapters/mailer.adapter';
import { NodeMailerAdapter } from './adapters/node-mailer.adapter';

@Module({
  providers: [
    NodeMailerAdapter,
    {
      provide: MailerAdapter,
      useExisting: NodeMailerAdapter,
    },
  ],
  exports: [MailerAdapter],
})
export class AuthMailerModule {}
