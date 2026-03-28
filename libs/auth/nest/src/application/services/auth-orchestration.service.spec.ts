import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthAccountRepository } from '../ports/auth-account.repository';
import { AuthUserRepository } from '../ports/auth-user.repository';
import { AuthEnginePort } from './auth-engine.port';
import { AuthOrchestrationService } from './auth-orchestration.service';
import { HashService } from './hash.service';

describe('AuthOrchestrationService', () => {
  let service: AuthOrchestrationService;

  let mockHashService: {
    hash: jest.Mock;
    compare: jest.Mock;
  };

  let mockAuthAccountRepository: {
    findCredentialAccountByUserId: jest.Mock;
    upsertCredentialAccount: jest.Mock;
  };

  let mockAuthUserRepository: {
    ensureRole: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };

  let mockAuthEnginePort: {
    register: jest.Mock;
    login: jest.Mock;
    logout: jest.Mock;
    getSession: jest.Mock;
    requestPasswordReset: jest.Mock;
    resetPassword: jest.Mock;
    verifyEmail: jest.Mock;
  };

  beforeEach(async () => {
    mockHashService = {
      hash: jest.fn().mockResolvedValue('hashedPassword'),
      compare: jest.fn().mockResolvedValue(true),
    };

    mockAuthAccountRepository = {
      findCredentialAccountByUserId: jest.fn(),
      upsertCredentialAccount: jest.fn(),
    };

    mockAuthUserRepository = {
      ensureRole: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    mockAuthEnginePort = {
      register: jest.fn().mockResolvedValue({
        success: true,
        userId: 'user-id',
      }),
      login: jest.fn(),
      logout: jest.fn(),
      getSession: jest.fn(),
      requestPasswordReset: jest.fn().mockResolvedValue({ success: true }),
      resetPassword: jest.fn().mockResolvedValue({ success: true }),
      verifyEmail: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthOrchestrationService,
        { provide: HashService, useValue: mockHashService },
        {
          provide: AuthAccountRepository,
          useValue: mockAuthAccountRepository,
        },
        { provide: AuthUserRepository, useValue: mockAuthUserRepository },
        { provide: AuthEnginePort, useValue: mockAuthEnginePort },
      ],
    }).compile();

    service = module.get<AuthOrchestrationService>(AuthOrchestrationService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('delegates login to AuthEnginePort and hydrates the canonical user payload', async () => {
    const dto = { credential: 'testuser', password: 'password123' };
    const headers = new Headers({
      'set-cookie': 'better-auth.session=abc; Path=/; HttpOnly',
    });
    mockAuthEnginePort.login.mockResolvedValue({
      userId: 'user-id',
      headers,
    });
    mockAuthUserRepository.findOne.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      roles: [],
    });

    await expect(service.login(dto)).resolves.toEqual({
      body: {
        user: {
          id: 'user-id',
          email: 'user@example.com',
          roles: [],
        },
        rbac: [],
      },
      headers,
    });
    expect(mockAuthEnginePort.login).toHaveBeenCalledWith(dto, undefined);
  });

  it('delegates core logout to AuthEnginePort', async () => {
    const dto = {};
    const headers = new Headers({
      'set-cookie': 'better-auth.session=; Max-Age=0',
    });
    mockAuthEnginePort.logout.mockResolvedValue({ success: true, headers });

    await expect(service.logout(dto)).resolves.toEqual({
      body: { success: true },
      headers,
    });
    expect(mockAuthEnginePort.logout).toHaveBeenCalledWith(dto, undefined);
  });

  it('registers through the Better Auth engine and assigns the default role', async () => {
    const dto = {
      name: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    await expect(service.registerUser(dto)).resolves.toEqual({ success: true });
    expect(mockAuthEnginePort.register).toHaveBeenCalledWith(dto);
    expect(mockAuthUserRepository.ensureRole).toHaveBeenCalledWith(
      'user-id',
      'user',
    );
  });

  it('rejects registration when passwords do not match', async () => {
    await expect(
      service.registerUser({
        email: 'user@example.com',
        name: 'User',
        password: 'secret-1',
        confirmPassword: 'secret-2',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects registration when the email already exists', async () => {
    mockAuthUserRepository.find.mockResolvedValueOnce([
      { id: 'existing-user-id', email: 'user@example.com' },
    ]);

    await expect(
      service.registerUser({
        email: 'user@example.com',
        name: 'User',
        password: 'secret-1',
        confirmPassword: 'secret-1',
      }),
    ).rejects.toThrow(new BadRequestException('User already exists'));
  });

  it('delegates forgotPassword to the Better Auth engine', async () => {
    const dto = { email: 'test@example.com' };

    await expect(service.forgotPassword(dto)).resolves.toEqual({ success: true });
    expect(mockAuthEnginePort.requestPasswordReset).toHaveBeenCalledWith(dto);
  });

  it('delegates password reset to the Better Auth engine', async () => {
    const dto = {
      token: 'reset-token',
      password: 'newPassword123',
      confirmPassword: 'newPassword123',
    };

    await expect(service.resetPassword(dto)).resolves.toEqual({ success: true });
    expect(mockAuthEnginePort.resetPassword).toHaveBeenCalledWith(dto);
    expect(mockAuthUserRepository.update).not.toHaveBeenCalled();
  });

  it('updates the credential account when changing a password', async () => {
    mockAuthUserRepository.findOne.mockResolvedValueOnce({
      id: 'user-id',
    });
    mockAuthAccountRepository.findCredentialAccountByUserId.mockResolvedValueOnce({
      id: 'user-id-credential',
      userId: 'user-id',
      accountId: 'user-id',
      providerId: 'credential',
      password: 'current-hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.changePassword('user-id', {
        currentPassword: 'old-password',
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      }),
    ).resolves.toEqual({ success: true });

    expect(mockHashService.compare).toHaveBeenCalledWith(
      'old-password',
      'current-hash',
    );
    expect(mockAuthAccountRepository.upsertCredentialAccount).toHaveBeenCalledWith(
      {
        userId: 'user-id',
        passwordHash: 'hashedPassword',
      },
    );
    expect(mockAuthUserRepository.update).not.toHaveBeenCalled();
  });

  it('validates updateEmail against the credential account password', async () => {
    mockAuthUserRepository.findOne.mockResolvedValueOnce({
      id: 'user-id',
      email: 'current@example.com',
    });
    mockAuthAccountRepository.findCredentialAccountByUserId.mockResolvedValueOnce({
      id: 'user-id-credential',
      userId: 'user-id',
      accountId: 'user-id',
      providerId: 'credential',
      password: 'current-hash',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.updateEmail('user-id', {
        newEmail: 'updated@example.com',
        password: 'current-password',
      }),
    ).resolves.toEqual({ success: true });

    expect(mockHashService.compare).toHaveBeenCalledWith(
      'current-password',
      'current-hash',
    );
    expect(mockAuthUserRepository.update).toHaveBeenCalledWith({
      id: 'user-id',
      email: 'updated@example.com',
    });
  });

  it('delegates email verification to the Better Auth engine', async () => {
    const dto = { token: 'verification-token' };

    await expect(service.verifyEmail(dto)).resolves.toEqual({ success: true });
    expect(mockAuthEnginePort.verifyEmail).toHaveBeenCalledWith(
      'verification-token',
    );
  });

  it('delegates activation to the Better Auth verification path', async () => {
    const dto = { token: 'activation-token' };

    await expect(service.activateUser(dto)).resolves.toEqual({ success: true });
    expect(mockAuthEnginePort.verifyEmail).toHaveBeenCalledWith(
      'activation-token',
    );
  });

  it('maps Better Auth reset-password token failures to BadRequest', async () => {
    mockAuthEnginePort.resetPassword.mockRejectedValueOnce(new Error('invalid'));

    await expect(
      service.resetPassword({
        token: 'bad-token',
        password: 'newPassword123',
        confirmPassword: 'newPassword123',
      }),
    ).rejects.toThrow(new BadRequestException('Invalid token'));
  });

  it('maps Better Auth verify-email token failures to BadRequest', async () => {
    mockAuthEnginePort.verifyEmail.mockRejectedValueOnce(new Error('invalid'));

    await expect(
      service.verifyEmail({ token: 'bad-token' }),
    ).rejects.toThrow(new BadRequestException('Invalid token'));
  });

  it('returns user info from the active Better Auth session', async () => {
    const headers = new Headers({
      'set-cookie': 'better-auth.session=abc; Path=/; HttpOnly',
    });
    mockAuthEnginePort.getSession.mockResolvedValue({
      userId: 'user-id',
      headers,
    });
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

    await expect(
      service.getLoggedInUserInfo(new Headers({ cookie: 'better-auth.session=abc' })),
    ).resolves.toEqual({
      body: {
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
      },
      headers,
    });
  });

  it('rejects when there is no active Better Auth session', async () => {
    mockAuthEnginePort.getSession.mockResolvedValue(null);

    await expect(service.getLoggedInUserInfo()).rejects.toThrow(
      new BadRequestException('No active auth session'),
    );
  });

  it('rejects malformed persisted permissions', async () => {
    mockAuthEnginePort.getSession.mockResolvedValue({
      userId: 'user-id',
      headers: undefined,
    });
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

    await expect(service.getLoggedInUserInfo()).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
