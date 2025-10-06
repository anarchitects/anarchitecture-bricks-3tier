import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmContactsRepository } from './contacts.repository';
import { faker } from '@faker-js/faker';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ContactEntity } from '../entities/contact.entity';
import { NotFoundException } from '@nestjs/common';

describe('ContactsRepository', () => {
  let provider: TypeOrmContactsRepository;

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
    save: jest.fn().mockResolvedValue(mockContact),
    findOneBy: jest.fn().mockResolvedValue(mockContact),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TypeOrmContactsRepository],
    })
      .useMocker((token) => {
        if (token === getRepositoryToken(ContactEntity)) {
          return mockContactsRepository;
        }
        return undefined;
      })
      .compile();

    provider = module.get<TypeOrmContactsRepository>(TypeOrmContactsRepository);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
  describe('findById', () => {
    it('should return a contact if found', async () => {
      const result = await provider.findById(faker.string.uuid());
      expect(result).toEqual(mockContact);
      expect(mockContactsRepository.findOneBy).toHaveBeenCalledTimes(1);
    });
    it('should throw NotFoundException if contact not found', async () => {
      mockContactsRepository.findOneBy.mockResolvedValueOnce(null);
      try {
        await provider.findById(faker.string.uuid());
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });
  describe('create', () => {
    it('should create and return a contact', async () => {
      const result = await provider.create(mockContact);
      expect(result).toEqual(mockContact);
      expect(mockContactsRepository.create).toHaveBeenCalledTimes(1);
      expect(mockContactsRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
