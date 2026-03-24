import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { HashService } from '../application/services/hash.service';
import { AuthUserRepository } from '../infrastructure-persistence/repositories/auth-user.repository';
import { LegacyJwtAuthEngineAdapter } from './legacy-jwt-auth-engine.adapter';

describe('LegacyJwtAuthEngineAdapter', () => {
  let service: LegacyJwtAuthEngineAdapter;

  let mockHashService: {
    hash: jest.Mock;
    compare: jest.Mock;
  };

  let mockAuthUserRepository: {
    findOne: jest.Mock;
    invalidateTokens: jest.Mock;
    isTokenInvalidated: jest.Mock;
  };

  let mockJwtService: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
  };

  beforeEach(async () => {
    mockHashService = {
      hash: jest.fn().mockResolvedValue('hashedPassword'),
      compare: jest.fn().mockResolvedValue(true),
    };

    mockAuthUserRepository = {
      findOne: jest.fn(),
      invalidateTokens: jest.fn(),
      isTokenInvalidated: jest.fn().mockResolvedValue(false),
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('signedToken'),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LegacyJwtAuthEngineAdapter,
        { provide: HashService, useValue: mockHashService },
        { provide: AuthUserRepository, useValue: mockAuthUserRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<LegacyJwtAuthEngineAdapter>(
      LegacyJwtAuthEngineAdapter,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('logs in a user with valid credentials', async () => {
    const dto = { credential: 'testuser', password: 'password123' };
    mockAuthUserRepository.findOne.mockResolvedValueOnce({
      id: 'user-id',
      passwordHash: 'hashedPassword',
    });

    await expect(service.login(dto)).resolves.toEqual({
      accessToken: 'signedToken',
      refreshToken: 'signedToken',
    });
    expect(mockHashService.compare).toHaveBeenCalledWith(
      'password123',
      'hashedPassword',
    );
  });

  it('rejects invalid credentials', async () => {
    const dto = { credential: 'testuser', password: 'wrongpassword' };
    mockAuthUserRepository.findOne.mockResolvedValueOnce(null);

    await expect(service.login(dto)).rejects.toThrow('Invalid credentials');
  });

  it('logs out by invalidating hashed tokens', async () => {
    const dto = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };
    mockJwtService.verifyAsync.mockResolvedValueOnce({ sub: 'user-id' });
    mockAuthUserRepository.findOne.mockResolvedValueOnce({
      id: 'user-id',
    });
    mockHashService.hash.mockResolvedValue('hashed-token');

    await expect(service.logout(dto)).resolves.toEqual({ success: true });
    expect(mockAuthUserRepository.invalidateTokens).toHaveBeenCalledWith(
      ['hashed-token', 'hashed-token'],
      'user-id',
    );
  });

  it('rejects invalid refresh tokens on logout', async () => {
    const dto = {
      accessToken: 'access-token',
      refreshToken: 'invalid-token',
    };
    mockJwtService.verifyAsync.mockRejectedValueOnce(new Error());

    await expect(service.logout(dto)).rejects.toThrow('Invalid refresh token');
  });

  it('refreshes tokens for a valid refresh token', async () => {
    const userId = 'user-id';
    const dto = { refreshToken: 'valid-refresh-token' };
    mockJwtService.verifyAsync.mockResolvedValueOnce({ sub: 'user-id' });
    mockAuthUserRepository.findOne.mockResolvedValueOnce({
      id: 'user-id',
    });
    mockAuthUserRepository.isTokenInvalidated.mockResolvedValueOnce(false);

    await expect(service.refreshTokens(userId, dto)).resolves.toEqual({
      accessToken: 'signedToken',
      refreshToken: 'signedToken',
    });
  });

  it('rejects invalidated refresh tokens', async () => {
    const userId = 'user-id';
    const dto = { refreshToken: 'valid-refresh-token' };
    mockJwtService.verifyAsync.mockResolvedValueOnce({ sub: 'user-id' });
    mockAuthUserRepository.findOne.mockResolvedValueOnce({
      id: 'user-id',
    });
    mockAuthUserRepository.isTokenInvalidated.mockResolvedValueOnce(true);

    await expect(service.refreshTokens(userId, dto)).rejects.toThrow(
      'Refresh token has been invalidated',
    );
  });
});
