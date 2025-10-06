import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from './contacts.controller';
import { ContactsService } from '@anarchitects/contacts-nest-application';
import { faker } from '@faker-js/faker';
import { ContactRequestDto } from '@anarchitects/contacts-ts-dtos';

describe('ContactsController', () => {
  let controller: ContactsController;

  const mockResponse = { success: true };

  const mockRequestDto: ContactRequestDto = {
    email: faker.internet.email(),
    name: faker.person.fullName(),
    message: faker.lorem.sentence(),
  };

  const mockContactsService = {
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
