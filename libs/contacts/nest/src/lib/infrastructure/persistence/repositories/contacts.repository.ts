import { Injectable, NotFoundException } from '@nestjs/common';
import { ContactEntity } from '../entities/contact.entity';
import { ContactsRepository } from '../../../application/ports/contacts.repository';
import type { Contact } from '@anarchitects/contacts-ts/models';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TypeOrmContactsRepository implements ContactsRepository {
  constructor(
    @InjectRepository(ContactEntity)
    private readonly contactsRepository: Repository<ContactEntity>
  ) {}
  async findAll(): Promise<Contact[]> {
    return this.contactsRepository.find();
  }

  async findById(id: string): Promise<Contact> {
    const contact = await this.contactsRepository.findOneBy({ id });
    if (!contact) {
      throw new NotFoundException(`Contact with id ${id} not found`);
    }
    return contact;
  }
  async create(contact: Partial<Contact>): Promise<Contact> {
    const newContact = this.contactsRepository.create(contact);
    return this.contactsRepository.save(newContact);
  }
}
