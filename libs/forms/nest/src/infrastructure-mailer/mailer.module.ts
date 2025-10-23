import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailerAdapter } from './adapters/mailer.adapter';
import { NestMailerAdapter } from './adapters/node-mailer.adapter';

@Module({
  imports: [MailerModule],
  providers: [
    NestMailerAdapter,
    {
      provide: MailerAdapter,
      useExisting: NestMailerAdapter,
    },
  ],
  exports: [MailerAdapter],
})
export class FormsInfrastructureMailerModule {}
