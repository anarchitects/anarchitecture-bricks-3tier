import { Module } from '@nestjs/common';
import { NodeMailerAdapter } from './adapters/node-mailer.adapter';
import { MailerAdapter } from './adapters/mailer.adapter';

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
export class MailerModule {}
