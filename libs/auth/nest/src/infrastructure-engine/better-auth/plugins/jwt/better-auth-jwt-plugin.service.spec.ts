import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BetterAuthJwtPluginService } from './better-auth-jwt-plugin.service';
import { HashService } from '../../../../application/services/hash.service';
import { AuthAccountRepository } from '../../../../infrastructure-persistence/repositories/auth-account.repository';
import { AuthUserRepository } from '../../../../infrastructure-persistence/repositories/auth-user.repository';
import { JwtTokenInvalidationRepository } from './jwt-token-invalidation.repository';

describe('BetterAuthJwtPluginService', () => {
  let service: BetterAuthJwtPluginService;

  const mockHashService = {
    compare: jest.fn(),
    hash: jest.fn(),
  };
  const mockAuthAccountRepository = {
    findCredentialAccountByUserId: jest.fn(),
  };
  const mockAuthUserRepository = {
    findOne: jest.fn(),
  };
  const mockJwtTokenInvalidationRepository = {
    invalidateTokens: jest.fn(),
    isTokenInvalidated: jest.fn(),
  };
  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new BetterAuthJwtPluginService(
      mockHashService as unknown as HashService,
      mockAuthAccountRepository as unknown as AuthAccountRepository,
      mockAuthUserRepository as unknown as AuthUserRepository,
      mockJwtTokenInvalidationRepository as unknown as JwtTokenInvalidationRepository,
      mockJwtService as unknown as JwtService,
    );
  });

  it('validates login credentials against the credential account password', async () => {
    mockAuthUserRepository.findOne.mockResolvedValueOnce({
      id: 'user-id',
      roles: [{ name: 'user' }],
    });
    mockAuthAccountRepository.findCredentialAccountByUserId.mockResolvedValueOnce(
      {
        id: 'user-id-credential',
        userId: 'user-id',
        accountId: 'user-id',
        providerId: 'credential',
        password: 'stored-hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    );
    mockHashService.compare.mockResolvedValueOnce(true);
    mockJwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    await expect(
      service.login({ credential: 'user@example.com', password: 'secret' }),
    ).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(mockHashService.compare).toHaveBeenCalledWith(
      'secret',
      'stored-hash',
    );
  });

  it('rejects login when the credential account is missing', async () => {
    mockAuthUserRepository.findOne.mockResolvedValueOnce({
      id: 'user-id',
      roles: [],
    });
    mockAuthAccountRepository.findCredentialAccountByUserId.mockResolvedValueOnce(
      null,
    );

    await expect(
      service.login({ credential: 'user@example.com', password: 'secret' }),
    ).rejects.toThrow(new BadRequestException('Invalid credentials'));
  });

  it('rejects login when the credential password does not match', async () => {
    mockAuthUserRepository.findOne.mockResolvedValueOnce({
      id: 'user-id',
      roles: [],
    });
    mockAuthAccountRepository.findCredentialAccountByUserId.mockResolvedValueOnce(
      {
        id: 'user-id-credential',
        userId: 'user-id',
        accountId: 'user-id',
        providerId: 'credential',
        password: 'stored-hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    );
    mockHashService.compare.mockResolvedValueOnce(false);

    await expect(
      service.login({ credential: 'user@example.com', password: 'secret' }),
    ).rejects.toThrow(new BadRequestException('Invalid credentials'));
  });

  it('invalidates token hashes on logout through the JWT invalidation repository', async () => {
    mockJwtService.verifyAsync.mockResolvedValueOnce({ sub: 'user-id' });
    mockAuthUserRepository.findOne.mockResolvedValueOnce({
      id: 'user-id',
      roles: [],
    });
    mockHashService.hash
      .mockResolvedValueOnce('hashed-access-token')
      .mockResolvedValueOnce('hashed-refresh-token');

    await expect(
      service.logout({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    ).resolves.toEqual({ success: true });

    expect(
      mockJwtTokenInvalidationRepository.invalidateTokens,
    ).toHaveBeenCalledWith(
      ['hashed-access-token', 'hashed-refresh-token'],
      'user-id',
    );
  });

  it('rejects refresh when the refresh token has been invalidated', async () => {
    mockJwtService.verifyAsync.mockResolvedValueOnce({ sub: 'user-id' });
    mockAuthUserRepository.findOne.mockResolvedValueOnce({
      id: 'user-id',
      roles: [],
    });
    mockHashService.hash.mockResolvedValueOnce('hashed-refresh-token');
    mockJwtTokenInvalidationRepository.isTokenInvalidated.mockResolvedValueOnce(
      true,
    );

    await expect(
      service.refreshTokens({ refreshToken: 'refresh-token' }),
    ).rejects.toThrow(
      new BadRequestException('Refresh token has been invalidated'),
    );
  });
});
