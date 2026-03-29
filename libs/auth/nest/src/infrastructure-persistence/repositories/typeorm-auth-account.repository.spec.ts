import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountEntity } from '../entities/account.entity';
import { TypeormAuthAccountRepository } from './typeorm-auth-account.repository';

describe('TypeormAuthAccountRepository', () => {
  let repository: TypeormAuthAccountRepository;

  const existingAccount = Object.assign(new AccountEntity(), {
    id: 'user-id-credential',
    accountId: 'user-id',
    providerId: 'credential',
    userId: 'user-id',
    accessToken: null,
    refreshToken: null,
    idToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
    scope: null,
    password: 'hashed-password',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  });

  const mockAccountRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    merge: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeormAuthAccountRepository,
        {
          provide: getRepositoryToken(AccountEntity),
          useValue: mockAccountRepository,
        },
      ],
    }).compile();

    repository = module.get<TypeormAuthAccountRepository>(
      TypeormAuthAccountRepository,
    );
  });

  it('returns the credential account for a user when it exists', async () => {
    mockAccountRepository.findOne.mockResolvedValueOnce(existingAccount);

    await expect(
      repository.findCredentialAccountByUserId('user-id'),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'user-id-credential',
        providerId: 'credential',
        password: 'hashed-password',
      }),
    );
    expect(mockAccountRepository.findOne).toHaveBeenCalledWith({
      where: {
        accountId: 'user-id',
        providerId: 'credential',
      },
    });
  });

  it('creates a credential account when none exists yet', async () => {
    const createdAccount = {
      ...existingAccount,
      createdAt: new Date('2024-02-01T00:00:00.000Z'),
      updatedAt: new Date('2024-02-01T00:00:00.000Z'),
    };
    mockAccountRepository.findOne.mockResolvedValueOnce(null);
    mockAccountRepository.create.mockReturnValue(createdAccount);
    mockAccountRepository.save.mockResolvedValue(createdAccount);

    await expect(
      repository.upsertCredentialAccount({
        userId: 'user-id',
        passwordHash: 'hashed-password',
        createdAt: createdAccount.createdAt,
        updatedAt: createdAccount.updatedAt,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        userId: 'user-id',
        password: 'hashed-password',
      }),
    );

    expect(mockAccountRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-id-credential',
        accountId: 'user-id',
        providerId: 'credential',
        userId: 'user-id',
        password: 'hashed-password',
      }),
    );
  });

  it('updates the password on an existing credential account', async () => {
    const mergedAccount = {
      ...existingAccount,
      password: 'new-hash',
    };
    mockAccountRepository.findOne.mockResolvedValueOnce(existingAccount);
    mockAccountRepository.merge.mockReturnValue(mergedAccount);
    mockAccountRepository.save.mockResolvedValue(mergedAccount);

    await repository.upsertCredentialAccount({
      userId: 'user-id',
      passwordHash: 'new-hash',
    });

    expect(mockAccountRepository.merge).toHaveBeenCalledWith(
      existingAccount,
      expect.objectContaining({
        password: 'new-hash',
      }),
    );
  });
});
