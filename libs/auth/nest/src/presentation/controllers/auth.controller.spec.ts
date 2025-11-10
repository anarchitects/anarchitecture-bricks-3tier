import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../application/services/auth.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    registerUser: jest.fn().mockResolvedValue({ success: true }),
    activateUser: jest.fn().mockResolvedValue({ success: true }),
    login: jest
      .fn()
      .mockResolvedValue({ accessToken: 'token', refreshToken: 'refresh' }),
    logout: jest.fn().mockResolvedValue({ success: true }),
    changePassword: jest.fn().mockResolvedValue({ success: true }),
    forgotPassword: jest.fn().mockResolvedValue({ success: true }),
    resetPassword: jest.fn().mockResolvedValue({ success: true }),
    verifyEmail: jest.fn().mockResolvedValue({ success: true }),
    updateEmail: jest.fn().mockResolvedValue({ success: true }),
    refreshTokens: jest.fn().mockResolvedValue({
      accessToken: 'newToken',
      refreshToken: 'newRefresh',
    }),
    getLoggedInUserInfo: jest.fn().mockResolvedValue({
      user: { id: 'user-id-123', email: 'test@example.com' },
      rbac: [
        {
          subject: 'Article',
          action: 'update',
          conditions: { authorId: 'user-id-123' },
        },
      ],
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('registerUser', () => {
    it('should call authService.registerUser and return its result', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password',
        confirmPassword: 'password',
        userName: 'testuser',
      };
      const result = await controller.registerUser(dto);
      expect(mockAuthService.registerUser).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ success: true });
    });
  });
  describe('activateUser', () => {
    it('should call authService.activateUser and return its result', async () => {
      const dto = { token: 'activation-token' };
      const result = await controller.activateUser(dto);
      expect(mockAuthService.activateUser).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ success: true });
    });
  });
  describe('login', () => {
    it('should call authService.login and return its result', async () => {
      const dto = { credential: 'testuser', password: 'password' };
      const result = await controller.login(dto);
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ accessToken: 'token', refreshToken: 'refresh' });
    });
  });
  describe('logout', () => {
    it('should call authService.logout and return its result', async () => {
      const dto = { accessToken: 'token', refreshToken: 'refresh' };
      const result = await controller.logout(dto);
      expect(mockAuthService.logout).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ success: true });
    });
  });
  describe('changePassword', () => {
    it('should call authService.changePassword and return its result', async () => {
      const userId = 'user-id-123';
      const dto = {
        currentPassword: 'oldpass',
        newPassword: 'newpass',
        confirmPassword: 'newpass',
      };
      const result = await controller.changePassword(userId, dto);
      expect(mockAuthService.changePassword).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual({ success: true });
    });
  });
  describe('forgotPassword', () => {
    it('should call authService.forgotPassword and return its result', async () => {
      const dto = { email: 'test@example.com' };
      const result = await controller.forgotPassword(dto);
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ success: true });
    });
  });
  describe('resetPassword', () => {
    it('should call authService.resetPassword and return its result', async () => {
      const dto = {
        token: 'reset-token',
        password: 'newpass',
        confirmPassword: 'newpass',
      };
      const result = await controller.resetPassword(dto);
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ success: true });
    });
  });
  describe('verifyEmail', () => {
    it('should call authService.verifyEmail and return its result', async () => {
      const dto = { token: 'verify-token' };
      const result = await controller.verifyEmail(dto);
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ success: true });
    });
  });
  describe('updateEmail', () => {
    it('should call authService.updateEmail and return its result', async () => {
      const userId = 'user-id-123';
      const dto = { newEmail: 'new@example.com' };
      const result = await controller.updateEmail(userId, dto);
      expect(mockAuthService.updateEmail).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual({ success: true });
    });
  });
  describe('refreshTokens', () => {
    it('should call authService.refreshTokens and return its result', async () => {
      const dto = { refreshToken: 'refresh-token' };
      const userId = 'user-id-123';
      const result = await controller.refreshTokens(userId, dto);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual({
        accessToken: 'newToken',
        refreshToken: 'newRefresh',
      });
    });
  });
  describe('getLoggedInUserInfo', () => {
    it('should call authService.getLoggedInUserInfo and return its result', async () => {
      const userId = 'user-id-123';
      const result = await controller.getLoggedInUserInfo({
        user: { sub: userId },
      });
      expect(mockAuthService.getLoggedInUserInfo).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        user: { id: 'user-id-123', email: 'test@example.com' },
        rbac: [
          {
            subject: 'Article',
            action: 'update',
            conditions: { authorId: 'user-id-123' },
          },
        ],
      });
    });
  });
});
