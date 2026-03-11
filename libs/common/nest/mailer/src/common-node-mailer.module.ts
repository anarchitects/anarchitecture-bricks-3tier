import { Global, Module } from '@nestjs/common';
import { NodeMailerAdapter } from './adapters/node-mailer.adapter';
import { MailerPort } from './ports/mailer.port';

@Global()
@Module({
  providers: [
    NodeMailerAdapter,
    {
      provide: MailerPort,
      useExisting: NodeMailerAdapter,
    },
  ],
  exports: [MailerPort, NodeMailerAdapter],
})
export class CommonNodeMailerModule {}
