import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmContactsRepository } from './repositories/contacts.repository';
import { CONTACTS_REPOSITORY } from '../../application/ports/contacts.repository';
import { ContactEntity } from './entities/contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContactEntity])],
  providers: [
    {
      provide: CONTACTS_REPOSITORY,
      useFactory: (repository: TypeOrmContactsRepository) => repository,
      inject: [TypeOrmContactsRepository],
    },
  ],
  exports: [CONTACTS_REPOSITORY, TypeOrmModule],
})
export class ContactsNestInfraPersistenceModule {}
