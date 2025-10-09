import { Module } from '@nestjs/common';
import { ContactsNestApplicationModule } from '../application/application.module';
import { ContactsController } from './controllers/contacts.controller';

@Module({
  imports: [ContactsNestApplicationModule],
  controllers: [ContactsController],
  providers: [],
  exports: [],
})
export class ContactsNestPresentationModule {}
