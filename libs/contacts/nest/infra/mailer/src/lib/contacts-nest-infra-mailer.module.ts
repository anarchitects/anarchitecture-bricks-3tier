import { Module } from '@nestjs/common';
import { NestContactsMailSender } from './contacts.mail-sender';
import { CONTACTS_MAIL_SENDER } from '@anarchitects/contacts-nest-application';
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
