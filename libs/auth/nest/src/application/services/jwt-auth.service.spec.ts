import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthService } from './jwt-auth.service';
import { HashService } from './hash.service';
import { AuthUserRepository } from '../../infrastructure-persistence/repositories/auth-user.repository';
import { JwtService } from '@nestjs/jwt';

describe('JwtAuthService', () => {
  let service: JwtAuthService;

  const malformedPermissions = [
    {
      description: 'empty action',
      permission: {
        action: '',
        subject: 'Project',
        conditions: null,
        fields: null,
        inverted: false,
        reason: null,
      },
    },
    {
      description: 'missing subject',
      permission: {
        action: 'read',
        subject: undefined,
        conditions: null,
        fields: null,
        inverted: false,
        reason: null,
      },
    },
    {
      description: 'invalid conditions',
      permission: {
        action: 'read',
        subject: 'Project',
        conditions: [],
        fields: null,
        inverted: false,
        reason: null,
      },
    },
    {
      description: 'invalid fields',
      permission: {
        action: 'read',
        subject: 'Project',
        conditions: null,
        fields: 'name',
        inverted: false,
        reason: null,
      },
    },
    {
      description: 'invalid inverted flag',
      permission: {
        action: 'read',
        subject: 'Project',
        conditions: null,
        fields: null,
        inverted: 'true',
        reason: null,
      },
    },
    {
      description: 'invalid reason',
      permission: {
        action: 'read',
        subject: 'Project',
        conditions: null,
        fields: null,
        inverted: false,
        reason: 123,
      },
    },
  ];

  let mockHashService: {
    hash: jest.Mock;
    compare: jest.Mock;
  };

  let mockAuthUserRepository: {
    create: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
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
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      invalidateTokens: jest.fn(),
      isTokenInvalidated: jest.fn().mockResolvedValue(false),
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('signedToken'),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthService,
        { provide: HashService, useValue: mockHashService },
        { provide: AuthUserRepository, useValue: mockAuthUserRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<JwtAuthService>(JwtAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('registerUser', () => {
    it('should register a new user', async () => {
      const dto = {
        userName: 'testuser',
        email: 'testuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };
      const result = await service.registerUser(dto);
      expect(result).toEqual({ success: true });
      expect(mockHashService.hash).toHaveBeenCalledWith('password123');
      expect(mockAuthUserRepository.create).toHaveBeenCalled();
    });
    it('should throw error if passwords do not match', async () => {
      const dto = {
        userName: 'testuser',
        email: 'testuser@example.com',
        password: 'password123',
        confirmPassword: 'password124',
      };
      await expect(service.registerUser(dto)).rejects.toThrow(
        'Passwords do not match',
      );
    });
  });
  describe('activateUser', () => {
    it('should activate a user', async () => {
      const dto = { token: 'activation-token' };
      mockAuthUserRepository.findOne.mockResolvedValueOnce({
        id: 'user-id',
        isActive: false,
        token: 'activation-token',
      });
      const result = await service.activateUser(dto);
      expect(result).toEqual({ success: true });
      expect(mockAuthUserRepository.update).toHaveBeenCalledWith({
        id: 'user-id',
        isActive: true,
        token: null,
      });
    });
  });
  describe('login', () => {
    it('should login a user', async () => {
      const dto = { credential: 'testuser', password: 'password123' };
      mockAuthUserRepository.findOne.mockResolvedValueOnce({
        id: 'user-id',
        passwordHash: 'hashedPassword',
      });
      const result = await service.login(dto);
      expect(result).toEqual({
        accessToken: 'signedToken',
        refreshToken: 'signedToken',
      });
      expect(mockHashService.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-id',
      });
    });
    it('should throw error for invalid credentials', async () => {
      const dto = { credential: 'testuser', password: 'wrongpassword' };
      mockAuthUserRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.login(dto)).rejects.toThrow('Invalid credentials');
    });
    it('should throw error for invalid password', async () => {
      const dto = { credential: 'testuser', password: 'wrongpassword' };
      mockAuthUserRepository.findOne.mockResolvedValueOnce({
        id: 'user-id',
        passwordHash: 'hashedPassword',
      });
      mockHashService.compare.mockResolvedValueOnce(false);
      await expect(service.login(dto)).rejects.toThrow('Invalid credentials');
    });
  });
  describe('logout', () => {
    it('should logout a user', async () => {
      const dto = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      mockJwtService.verifyAsync.mockResolvedValueOnce({ sub: 'user-id' });
      mockAuthUserRepository.findOne.mockResolvedValueOnce({
        id: 'user-id',
      });
      mockHashService.hash.mockResolvedValue('hashed-token');
      mockAuthUserRepository.invalidateTokens.mockResolvedValueOnce(undefined);
      const result = await service.logout(dto);
      expect(result).toEqual({ success: true });
      expect(mockAuthUserRepository.invalidateTokens).toHaveBeenCalledWith(
        ['hashed-token', 'hashed-token'],
        'user-id',
      );
    });
    it('should throw error for missing refresh token', async () => {
      const dto = { accessToken: 'access-token', refreshToken: '' };
      await expect(service.logout(dto)).rejects.toThrow(
        'Refresh token is required',
      );
    });
    it('should throw error for invalid refresh token', async () => {
      const dto = {
        accessToken: 'access-token',
        refreshToken: 'invalid-token',
      };
      mockJwtService.verifyAsync.mockRejectedValueOnce(new Error());
      await expect(service.logout(dto)).rejects.toThrow(
        'Invalid refresh token',
      );
    });
    it('should throw error if user not found during logout', async () => {
      const dto = { accessToken: 'access-token', refreshToken: 'valid-token' };
      mockJwtService.verifyAsync.mockResolvedValueOnce({ sub: 'user-id' });
      mockAuthUserRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.logout(dto)).rejects.toThrow(
        'Invalid refresh token',
      );
    });
  });
  describe('changePassword', () => {
    it('should change user password', async () => {
      const dto = {
        userId: 'user-id',
        currentPassword: 'currentPassword',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      };
      mockAuthUserRepository.findOne.mockResolvedValueOnce({
        id: 'user-id',
        passwordHash: 'hashedCurrentPassword',
      });
      const result = await service.changePassword(dto.userId, dto);
      expect(result).toEqual({ success: true });
      expect(mockHashService.compare).toHaveBeenCalledWith(
        'currentPassword',
        'hashedCurrentPassword',
      );
      expect(mockHashService.hash).toHaveBeenCalledWith('newPassword123');
      expect(mockAuthUserRepository.update).toHaveBeenCalledWith({
        id: 'user-id',
        passwordHash: 'hashedPassword',
      });
    });
    it('should throw error if current password is incorrect', async () => {
      const dto = {
        userId: 'user-id',
        currentPassword: 'wrongCurrentPassword',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      };
      mockAuthUserRepository.findOne.mockResolvedValueOnce({
        id: 'user-id',
        passwordHash: 'hashedCurrentPassword',
      });
      mockHashService.compare.mockResolvedValueOnce(false);
      await expect(service.changePassword(dto.userId, dto)).rejects.toThrow(
        'Invalid current password',
      );
    });
    it('should throw error if new passwords do not match', async () => {
      const dto = {
        userId: 'user-id',
        currentPassword: 'currentPassword',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword124',
      };
      await expect(service.changePassword(dto.userId, dto)).rejects.toThrow(
        'Passwords do not match',
      );
    });
    it('should throw error if user not found during password change', async () => {
      const dto = {
        userId: 'non-existent-user-id',
        currentPassword: 'currentPassword',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      };
      mockAuthUserRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.changePassword(dto.userId, dto)).rejects.toThrow(
        'User not found',
      );
    });
  });
  describe('forgotPassword', () => {
    it('should initiate forgot password process', async () => {
      const dto = { email: 'user@example.com' };
      mockAuthUserRepository.findOne.mockResolvedValueOnce({
        id: 'user-id',
        email: 'user@example.com',
      });
      const result = await service.forgotPassword(dto);
      expect(result).toEqual({ success: true });
      expect(mockAuthUserRepository.update).toHaveBeenCalled();
    });
    it('should throw error if user not found during forgot password', async () => {
      const dto = { email: 'user@example.com' };
      mockAuthUserRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.forgotPassword(dto)).rejects.toThrow(
        'User not found',
      );
    });
  });
  describe('resetPassword', () => {
    it('should reset user password', async () => {
      const dto = {
        token: 'reset-token',
        password: 'newPassword123',
        confirmPassword: 'newPassword123',
      };
      mockAuthUserRepository.findOne.mockResolvedValueOnce({
        id: 'user-id',
        token: 'reset-token',
      });
      const result = await service.resetPassword(dto);
      expect(result).toEqual({ success: true });
      expect(mockHashService.hash).toHaveBeenCalledWith('newPassword123');
      expect(mockAuthUserRepository.update).toHaveBeenCalledWith({
        id: 'user-id',
        passwordHash: 'hashedPassword',
        token: null,
      });
    });
    it('should throw error if passwords do not match during reset', async () => {
      const dto = {
        token: 'reset-token',
        password: 'newPassword123',
        confirmPassword: 'newPassword124',
      };
      await expect(service.resetPassword(dto)).rejects.toThrow(
        'Passwords do not match',
      );
    });
    it('should throw error if token is invalid during reset', async () => {
      const dto = {
        token: 'invalid-token',
        password: 'newPassword123',
        confirmPassword: 'newPassword123',
      };
      mockAuthUserRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.resetPassword(dto)).rejects.toThrow('Invalid token');
    });
  });
  describe('verifyEmail', () => {
    it('should verify user email', async () => {
      const dto = { token: 'verification-token' };
      mockAuthUserRepository.findOne.mockResolvedValueOnce({
        id: 'user-id',
        token: 'verification-token',
      });
      const result = await service.verifyEmail(dto);
      expect(result).toEqual({ success: true });
      expect(mockAuthUserRepository.update).toHaveBeenCalledWith({
        id: 'user-id',
        isActive: true,
        token: null,
      });
    });
    it('should throw error if token is invalid during email verification', async () => {
      const dto = { token: 'invalid-token' };
      mockAuthUserRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.verifyEmail(dto)).rejects.toThrow('Invalid token');
    });
  });
  describe('updateEmail', () => {
    it('should update user email', async () => {
      const userId = 'user-id';
      const dto = {
        newEmail: 'new-email@example.com',
        password: 'password123',
      };
      mockAuthUserRepository.findOne.mockResolvedValueOnce({
        id: 'user-id',
        email: 'user@example.com',
        passwordHash: 'hashedPassword',
      });
      const result = await service.updateEmail(userId, dto);
      expect(result).toEqual({ success: true });
      expect(mockHashService.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
      expect(mockAuthUserRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-id',
          email: 'new-email@example.com',
        }),
      );
    });
    it('should throw error if user not found during email update', async () => {
      const userId = 'non-existent-user-id';
      const dto = {
        newEmail: 'new-email@example.com',
        password: 'password123',
      };
      mockAuthUserRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.updateEmail(userId, dto)).rejects.toThrow(
        'User not found',
      );
    });
    it('should throw error if password is invalid during email update', async () => {
      const userId = 'user-id';
      const dto = {
        newEmail: 'new-email@example.com',
        password: 'wrongpassword',
      };
      mockAuthUserRepository.findOne.mockResolvedValueOnce({
        id: 'user-id',
        email: 'user@example.com',
        passwordHash: 'hashedPassword',
      });
      mockHashService.compare.mockResolvedValueOnce(false);
      await expect(service.updateEmail(userId, dto)).rejects.toThrow(
        'Invalid password',
      );
    });
  });
  describe('refreshTokens', () => {
    it('should refresh user tokens', async () => {
      const userId = 'user-id';
      const dto = { refreshToken: 'valid-refresh-token' };
      mockJwtService.verifyAsync.mockResolvedValueOnce({ sub: 'user-id' });
      mockAuthUserRepository.findOne.mockResolvedValueOnce({
        id: 'user-id',
      });
      mockAuthUserRepository.isTokenInvalidated.mockResolvedValueOnce(false);
      const result = await service.refreshTokens(userId, dto);
      expect(result).toEqual({
        accessToken: 'signedToken',
        refreshToken: 'signedToken',
      });
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
    });
    it('should throw error for invalid refresh token during token refresh', async () => {
      const userId = 'user-id';
      const dto = { refreshToken: 'invalid-refresh-token' };
      mockJwtService.verifyAsync.mockRejectedValueOnce(new Error());
      await expect(service.refreshTokens(userId, dto)).rejects.toThrow(
        'Invalid refresh token',
      );
    });
    it('should throw error if token subject does not match userId during token refresh', async () => {
      const userId = 'user-id';
      const dto = { refreshToken: 'valid-refresh-token' };
      mockJwtService.verifyAsync.mockResolvedValueOnce({
        sub: 'other-user-id',
      });
      await expect(service.refreshTokens(userId, dto)).rejects.toThrow(
        'Invalid refresh token',
      );
    });
    it('should throw error if user not found during token refresh', async () => {
      const userId = 'user-id';
      const dto = { refreshToken: 'valid-refresh-token' };
      mockJwtService.verifyAsync.mockResolvedValueOnce({ sub: 'user-id' });
      mockAuthUserRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.refreshTokens(userId, dto)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('getLoggedInUserInfo', () => {
    it('should return the user and validated policy rules', async () => {
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

    it.each(malformedPermissions)(
      'should fail closed on malformed persisted policy rules: $description',
      async ({ permission }) => {
        mockAuthUserRepository.findOne.mockResolvedValueOnce({
          id: 'user-id',
          email: 'user@example.com',
          roles: [
            {
              permissions: [permission],
            },
          ],
        });

        await expect(service.getLoggedInUserInfo('user-id')).rejects.toThrow(
          InternalServerErrorException,
        );
      },
    );
  });
});
