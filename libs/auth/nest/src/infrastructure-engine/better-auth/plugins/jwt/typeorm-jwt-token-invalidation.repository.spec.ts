import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TypeormJwtTokenInvalidationRepository } from './typeorm-jwt-token-invalidation.repository';
import { InvalidatedTokenEntity } from './invalidated-token.entity';

describe('TypeormJwtTokenInvalidationRepository', () => {
  let repository: TypeormJwtTokenInvalidationRepository;

  const mockInvalidatedTokenRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeormJwtTokenInvalidationRepository,
        {
          provide: getRepositoryToken(InvalidatedTokenEntity),
          useValue: mockInvalidatedTokenRepository,
        },
      ],
    }).compile();

    repository = module.get<TypeormJwtTokenInvalidationRepository>(
      TypeormJwtTokenInvalidationRepository,
    );
  });

  it('invalidates token hashes', async () => {
    mockInvalidatedTokenRepository.create.mockImplementation(
      (entity) => entity,
    );
    const expiresAt = new Date('2026-09-01T18:00:00.000Z');

    await repository.invalidateTokens(
      ['token-1', 'token-2'],
      'user-id',
      expiresAt,
    );

    expect(mockInvalidatedTokenRepository.create).toHaveBeenCalledTimes(2);
    expect(mockInvalidatedTokenRepository.save).toHaveBeenCalledWith([
      { tokenId: 'token-1', userId: 'user-id', expiresAt },
      { tokenId: 'token-2', userId: 'user-id', expiresAt },
    ]);
  });

  it('returns true when a token hash has been invalidated', async () => {
    mockInvalidatedTokenRepository.findOne.mockResolvedValueOnce({
      tokenId: 'token-1',
    });

    await expect(repository.isTokenInvalidated('token-1')).resolves.toBe(true);
  });

  it('returns false when a token hash is not invalidated', async () => {
    mockInvalidatedTokenRepository.findOne.mockResolvedValueOnce(null);

    await expect(repository.isTokenInvalidated('token-2')).resolves.toBe(false);
  });
});
