import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from './contacts.controller';
import { ContactsService } from '../../application/contacts.service';
import { faker } from '@faker-js/faker';
import type { Contact } from '@anarchitects/contacts-ts/models';
import { ContactRequestDto } from '@anarchitects/contacts-ts/dtos';

describe('ContactsController', () => {
  let controller: ContactsController;

  const mockResponse = { success: true };

  const mockRequestDto: ContactRequestDto = {
    email: faker.internet.email(),
    name: faker.person.fullName(),
    message: faker.lorem.sentence(),
  };

  const mockContact: Contact = {
    id: faker.string.uuid(),
    ...mockRequestDto,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };

  const mockContactsService = {
    getContacts: jest.fn().mockResolvedValue([mockContact]),
    getContact: jest.fn().mockResolvedValue(mockContact),
    createContact: jest.fn().mockResolvedValue(mockResponse),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
    })
      .useMocker((token) => {
        if (token === ContactsService) {
          return mockContactsService;
        }
        return undefined;
      })
      .compile();

    controller = module.get<ContactsController>(ContactsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('findContacts', () => {
    it('should return a list of contacts', async () => {
      const result = await controller.findContacts();
      expect(result).toEqual([mockContact]);
    });
  });
  describe('findContactById', () => {
    it('should return a contact by id', async () => {
      const result = await controller.findContactById(faker.string.uuid());
      expect(result).toEqual(mockContact);
    });
  });
  describe('createContact', () => {
    it('should create a contact', async () => {
      const result = await controller.createContact(mockRequestDto);
      expect(result).toEqual(mockResponse);
      expect(mockContactsService.createContact).toHaveBeenCalledWith(
        mockRequestDto
      );
    });
  });
});
