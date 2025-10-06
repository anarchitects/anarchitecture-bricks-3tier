import { Inject, Injectable } from '@nestjs/common';
import {
  CONTACTS_REPOSITORY,
  ContactsRepository,
} from './ports/contacts.repository';
import {
  CONTACTS_MAIL_SENDER,
  ContactsMailSender,
} from './ports/contacts.mail-sender';
import { Contact } from '@anarchitects/contacts-ts-models';

@Injectable()
export class ContactsService {
  constructor(
    @Inject(CONTACTS_REPOSITORY)
    private readonly contactsRepository: ContactsRepository,
    @Inject(CONTACTS_MAIL_SENDER)
    private readonly contactsMailSender: ContactsMailSender
  ) {}

  async createContact(contact: Partial<Contact>): Promise<Contact> {
    const createdContact = await this.contactsRepository.create(contact);
    await this.contactsMailSender.sendMail(
      createdContact.email,
      createdContact.name,
      createdContact.message
    );
    return createdContact;
  }
}
