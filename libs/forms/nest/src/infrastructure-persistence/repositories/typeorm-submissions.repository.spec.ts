import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmSubmissionsRepository } from './typeorm-submissions.repository';
import { faker } from '@faker-js/faker';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubmissionEntity } from '../entities/submission.entity';
import { NotFoundException } from '@nestjs/common';

describe('SubmissionsRepository', () => {
  let provider: TypeOrmSubmissionsRepository;

  const mockSubmission = {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    message: faker.lorem.sentence(),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };

  const mockContactsRepository = {
    create: jest.fn().mockResolvedValue(mockSubmission),
    save: jest.fn().mockResolvedValue(mockSubmission),
    findOne: jest.fn().mockResolvedValue(mockSubmission),
    find: jest.fn().mockResolvedValue([mockSubmission]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TypeOrmSubmissionsRepository],
    })
      .useMocker((token) => {
        if (token === getRepositoryToken(SubmissionEntity)) {
          return mockContactsRepository;
        }
        return undefined;
      })
      .compile();

    provider = module.get<TypeOrmSubmissionsRepository>(
      TypeOrmSubmissionsRepository
    );
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
  describe('getSubmissions', () => {
    it('should return an array of submissions', async () => {
      const result = await provider.getSubmissions();
      expect(result).toEqual([mockSubmission]);
      expect(mockContactsRepository.find).toHaveBeenCalledTimes(1);
    });
  });
  describe('getSubmission', () => {
    it('should return a submission if found', async () => {
      const result = await provider.getSubmission({ id: faker.string.uuid() });
      expect(result).toEqual(mockSubmission);
      expect(mockContactsRepository.findOne).toHaveBeenCalledTimes(1);
    });
    it('should throw NotFoundException if submission not found', async () => {
      mockContactsRepository.findOne.mockResolvedValueOnce(null);
      try {
        await provider.getSubmission({ id: faker.string.uuid() });
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });
  describe('createSubmission', () => {
    it('should create and return a submission', async () => {
      const result = await provider.createSubmission(mockSubmission);
      expect(result).toEqual(mockSubmission);
      expect(mockContactsRepository.create).toHaveBeenCalledTimes(1);
      expect(mockContactsRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
