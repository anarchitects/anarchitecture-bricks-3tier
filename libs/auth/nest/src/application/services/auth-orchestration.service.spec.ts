import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthUserRepository } from '../../infrastructure-persistence/repositories/auth-user.repository';
import { AuthEnginePort } from './auth-engine.port';
import { AuthOrchestrationService } from './auth-orchestration.service';
import { HashService } from './hash.service';

describe('AuthOrchestrationService', () => {
  let service: AuthOrchestrationService;

  let mockHashService: {
    hash: jest.Mock;
    compare: jest.Mock;
  };

  let mockAuthUserRepository: {
    create: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };

  let mockAuthEnginePort: {
    login: jest.Mock;
    logout: jest.Mock;
    refreshTokens: jest.Mock;
  };

  beforeEach(async () => {
    mockHashService = {
      hash: jest.fn().mockResolvedValue('hashedPassword'),
      compare: jest.fn().mockResolvedValue(true),
    };

    mockAuthUserRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    mockAuthEnginePort = {
      login: jest.fn(),
      logout: jest.fn(),
      refreshTokens: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthOrchestrationService,
        { provide: HashService, useValue: mockHashService },
        { provide: AuthUserRepository, useValue: mockAuthUserRepository },
        { provide: AuthEnginePort, useValue: mockAuthEnginePort },
      ],
    }).compile();

    service = module.get<AuthOrchestrationService>(AuthOrchestrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('delegates login to AuthEnginePort', async () => {
    const dto = { credential: 'testuser', password: 'password123' };
    mockAuthEnginePort.login.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    await expect(service.login(dto)).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(mockAuthEnginePort.login).toHaveBeenCalledWith(dto);
  });

  it('delegates logout to AuthEnginePort', async () => {
    const dto = { accessToken: 'access-token', refreshToken: 'refresh-token' };
    mockAuthEnginePort.logout.mockResolvedValue({ success: true });

    await expect(service.logout(dto)).resolves.toEqual({ success: true });
    expect(mockAuthEnginePort.logout).toHaveBeenCalledWith(dto);
  });

  it('delegates refreshTokens to AuthEnginePort', async () => {
    const dto = { refreshToken: 'refresh-token' };
    mockAuthEnginePort.refreshTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    await expect(service.refreshTokens('user-id', dto)).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(mockAuthEnginePort.refreshTokens).toHaveBeenCalledWith(
      'user-id',
      dto,
    );
  });

  it('preserves registration behavior', async () => {
    const dto = {
      userName: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    await expect(service.registerUser(dto)).resolves.toEqual({ success: true });
    expect(mockHashService.hash).toHaveBeenCalledWith('password123');
    expect(mockAuthUserRepository.create).toHaveBeenCalled();
  });

  it('preserves password reset behavior', async () => {
    const dto = {
      token: 'reset-token',
      password: 'newPassword123',
      confirmPassword: 'newPassword123',
    };
    mockAuthUserRepository.findOne.mockResolvedValueOnce({
      id: 'user-id',
      token: 'reset-token',
    });

    await expect(service.resetPassword(dto)).resolves.toEqual({ success: true });
    expect(mockHashService.hash).toHaveBeenCalledWith('newPassword123');
    expect(mockAuthUserRepository.update).toHaveBeenCalledWith({
      id: 'user-id',
      passwordHash: 'hashedPassword',
      token: null,
    });
  });

  it('preserves email verification behavior', async () => {
    const dto = { token: 'verification-token' };
    mockAuthUserRepository.findOne.mockResolvedValueOnce({
      id: 'user-id',
      token: 'verification-token',
    });

    await expect(service.verifyEmail(dto)).resolves.toEqual({ success: true });
    expect(mockAuthUserRepository.update).toHaveBeenCalledWith({
      id: 'user-id',
      isActive: true,
      token: null,
    });
  });

  it('returns user info with validated policy rules', async () => {
    mockAuthUserRepository.findOne.mockResolvedValueOnce({
      id: 'user-id',
      email: 'user@example.com',
      roles: [
        {
          permissions: [
            {
              action: 'read',
              subject: 'Project',
              conditions: { ownerId: 'user-id' },
              fields: ['name'],
              inverted: false,
              reason: 'Allowed',
            },
          ],
        },
      ],
    });

    await expect(service.getLoggedInUserInfo('user-id')).resolves.toEqual({
      user: {
        id: 'user-id',
        email: 'user@example.com',
        roles: [{ permissions: [expect.any(Object)] }],
      },
      rbac: [
        {
          action: 'read',
          subject: 'Project',
          conditions: { ownerId: 'user-id' },
          fields: ['name'],
          inverted: false,
          reason: 'Allowed',
        },
      ],
    });
  });

  it('rejects malformed persisted permissions', async () => {
    mockAuthUserRepository.findOne.mockResolvedValueOnce({
      id: 'user-id',
      email: 'user@example.com',
      roles: [
        {
          permissions: [
            {
              action: '',
              subject: 'Project',
              conditions: null,
              fields: null,
              inverted: false,
              reason: null,
            },
          ],
        },
      ],
    });

    await expect(service.getLoggedInUserInfo('user-id')).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
