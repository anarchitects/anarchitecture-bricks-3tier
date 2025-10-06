import { Test, TestingModule } from '@nestjs/testing';
import { ContactsService } from './contacts.service';
import type { Contact } from '@anarchitects/contacts-ts-models';
import { CONTACTS_REPOSITORY } from './ports/contacts.repository';
import { CONTACTS_MAIL_SENDER } from './ports/contacts.mail-sender';
import { faker } from '@faker-js/faker';

describe('ContactsService', () => {
  let service: ContactsService;
  const mockContact = {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    message: faker.lorem.sentence(),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };
  const mockContactsRepository = {
    create: jest.fn().mockResolvedValue(mockContact),
    findById: jest.fn().mockResolvedValue(mockContact),
  };
  const mockContactsMailSender = {
    sendMail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContactsService],
    })
      .useMocker((token) => {
        if (token === CONTACTS_REPOSITORY) {
          return mockContactsRepository;
        }
        if (token === CONTACTS_MAIL_SENDER) {
          return mockContactsMailSender;
        }
        return undefined;
      })
      .compile();

    service = module.get<ContactsService>(ContactsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('createContact', () => {
    it('should create a contact and send an email', async () => {
      const contactData: Partial<Contact> = {
        email: 'grace.hopper@example.com',
        name: 'Grace Hopper',
        message: 'Debug all the way.',
      };

      const result = await service.createContact(contactData);

      expect(mockContactsRepository.create).toHaveBeenCalledWith(contactData);
      expect(mockContactsMailSender.sendMail).toHaveBeenCalledWith(
        mockContact.email,
        mockContact.name,
        mockContact.message
      );
      expect(result).toEqual(mockContact);
    });
  });
});
