import { Module } from '@nestjs/common';
import { NestContactsMailSender } from '../mailer/senders/mailer.sender';
import { CONTACTS_MAIL_SENDER } from '../../application/ports/contacts.mail-sender';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [MailerModule],
  providers: [
    {
      provide: CONTACTS_MAIL_SENDER,
      useFactory: (service: NestContactsMailSender) => service,
      inject: [NestContactsMailSender],
    },
  ],
  exports: [CONTACTS_MAIL_SENDER],
})
export class ContactsNestInfraMailerModule {}
