import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { TypeOrmContactsRepository } from './repositories/contacts.repository';
import { CONTACTS_REPOSITORY } from '@anarchitects/contacts-nest-application';

@Module({
  imports: [MailerModule],
  providers: [
    {
      provide: CONTACTS_REPOSITORY,
      useFactory: (repository: TypeOrmContactsRepository) => repository,
      inject: [TypeOrmContactsRepository],
    },
  ],
  exports: [CONTACTS_REPOSITORY],
})
export class ContactsNestInfraPersistenceModule {}
