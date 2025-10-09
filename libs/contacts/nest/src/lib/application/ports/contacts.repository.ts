import type { Contact } from '@anarchitects/contacts-ts/models';

export abstract class ContactsRepository {
  abstract findAll(): Promise<Contact[]>;
  abstract findById(id: string): Promise<Contact>;
  abstract create(contact: Partial<Contact>): Promise<Contact>;
}

export const CONTACTS_REPOSITORY = Symbol('CONTACTS_REPOSITORY');
