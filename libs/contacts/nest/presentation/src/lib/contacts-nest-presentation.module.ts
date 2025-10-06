import { Module } from '@nestjs/common';
import { ContactsNestApplicationModule } from '@anarchitects/contacts-nest-application';
import { ContactsController } from './contacts.controller';

@Module({
  imports: [ContactsNestApplicationModule],
  controllers: [ContactsController],
  providers: [],
  exports: [],
})
export class ContactsNestPresentationModule {}
