import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';

@Module({
  controllers: [],
  providers: [ContactsService],
  exports: [],
})
export class ContactsNestApplicationModule {}
