import { Inject, Injectable } from '@nestjs/common';
import {
  CONTACTS_REPOSITORY,
  ContactsRepository,
} from './ports/contacts.repository';
import {
  CONTACTS_MAIL_SENDER,
  ContactsMailSender,
} from './ports/contacts.mail-sender';
import { ContactResponseDto } from '@anarchitects/contacts-ts/dtos';
import type { Contact } from '@anarchitects/contacts-ts/models';

@Injectable()
export class ContactsService {
  constructor(
    @Inject(CONTACTS_REPOSITORY)
    private readonly contactsRepository: ContactsRepository,
    @Inject(CONTACTS_MAIL_SENDER)
    private readonly contactsMailSender: ContactsMailSender
  ) {}

  async getContacts(): Promise<Contact[]> {
    return this.contactsRepository.findAll();
  }

  async getContact(id: string): Promise<Contact> {
    return this.contactsRepository.findById(id);
  }

  async createContact(contact: Partial<Contact>): Promise<ContactResponseDto> {
    const createdContact = await this.contactsRepository.create(contact);
    await this.contactsMailSender.sendMail(
      createdContact.email,
      createdContact.name,
      createdContact.message
    );
    return { success: true };
  }
}
