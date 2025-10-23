import { Module } from '@nestjs/common';
import { MailerAdapter } from './adapters/mailer.adapter';
import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { NestMailerAdapter } from './adapters/node-mailer.adapter';

@Module({
  imports: [MailerModule],
  providers: [
    {
      provide: MailerAdapter,
      useFactory: (mailer: MailerService): MailerAdapter => {
        return new NestMailerAdapter(mailer);
      },
      inject: [MailerService],
    },
  ],
  exports: [MailerAdapter],
})
export class FormsInfrastructureMailerModule {}
