import { Module } from '@nestjs/common';
import { MAILER_PORT, MailerPort } from '../application';
import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { NestMailerAdapter } from './adapters/mailer.adapter';

@Module({
  imports: [MailerModule],
  providers: [
    {
      provide: MAILER_PORT,
      useFactory: (mailer: MailerService): MailerPort => {
        return new NestMailerAdapter(mailer);
      },
      inject: [MailerService],
    },
  ],
  exports: [MAILER_PORT],
})
export class FormsMailerModule {}
