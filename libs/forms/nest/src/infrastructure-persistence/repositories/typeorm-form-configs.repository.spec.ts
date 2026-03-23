import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { NotFoundException } from '@nestjs/common';
import { FormConfigEntity } from '../entities/form-config.entity';
import { TypeOrmFormConfigsRepository } from './typeorm-form-configs.repository';

describe('TypeOrmFormConfigsRepository', () => {
  let provider: TypeOrmFormConfigsRepository;

  const mockFormConfig = {
    id: 'contact_default',
    version: 1,
    fields: [{ name: 'email', kind: 'email', required: true }],
    validationRules: [
      {
        kind: 'matchFields',
        sourceField: 'password',
        targetField: 'confirmPassword',
        message: 'Passwords must match.',
      },
    ],
  };

  const mockRepository = {
    findOne: jest.fn().mockResolvedValue(mockFormConfig),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TypeOrmFormConfigsRepository],
    })
      .useMocker((token) => {
        if (token === getRepositoryToken(FormConfigEntity)) {
          return mockRepository;
        }

        return undefined;
      })
      .compile();

    provider = module.get<TypeOrmFormConfigsRepository>(
      TypeOrmFormConfigsRepository,
    );
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should return a form config by id and version', async () => {
    const result = await provider.getFormConfig('contact_default', 1);
    expect(result).toEqual(mockFormConfig);
    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'contact_default', version: 1 },
    });
  });

  it('should throw NotFoundException if config is missing', async () => {
    mockRepository.findOne.mockResolvedValueOnce(null);

    await expect(
      provider.getFormConfig(faker.string.alphanumeric(12), 2),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
