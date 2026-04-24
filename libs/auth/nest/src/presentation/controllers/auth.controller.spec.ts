import { AUTH_PUBLIC_METADATA_KEY } from '@anarchitects/auth-declarations';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../application/services/auth.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;

  const sessionHeaders = new Headers({
    'set-cookie': 'better-auth.session=abc; Path=/; HttpOnly',
  });

  const mockAuthService = {
    registerUser: jest.fn().mockResolvedValue({ success: true }),
    activateUser: jest.fn().mockResolvedValue({ success: true }),
    login: jest.fn().mockResolvedValue({
      body: {
        user: { id: 'user-id-123', email: 'test@example.com' },
        rbac: [{ action: 'read', subject: 'all' }],
      },
      headers: sessionHeaders,
    }),
    logout: jest.fn().mockResolvedValue({
      body: { success: true },
      headers: sessionHeaders,
    }),
    changePassword: jest.fn().mockResolvedValue({ success: true }),
    forgotPassword: jest.fn().mockResolvedValue({ success: true }),
    resetPassword: jest.fn().mockResolvedValue({ success: true }),
    verifyEmail: jest.fn().mockResolvedValue({ success: true }),
    updateEmail: jest.fn().mockResolvedValue({ success: true }),
    getLoggedInUserInfo: jest.fn().mockResolvedValue({
      body: {
        user: { id: 'user-id-123', email: 'test@example.com' },
        rbac: [
          {
            subject: 'Article',
            action: 'update',
            conditions: { authorId: 'user-id-123' },
          },
        ],
      },
      headers: sessionHeaders,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('marks only session-bootstrap routes as public for global auth guards', () => {
    const publicMethods: Array<keyof AuthController> = [
      'registerUser',
      'activateUser',
      'login',
      'forgotPassword',
      'resetPassword',
      'verifyEmail',
    ];
    const protectedMethods: Array<keyof AuthController> = [
      'logout',
      'changePassword',
      'updateEmail',
      'getLoggedInUserInfo',
    ];

    publicMethods.forEach((method) => {
      expect(
        Reflect.getMetadata(
          AUTH_PUBLIC_METADATA_KEY,
          AuthController.prototype[method],
        ),
      ).toBe(true);
    });
    protectedMethods.forEach((method) => {
      expect(
        Reflect.getMetadata(
          AUTH_PUBLIC_METADATA_KEY,
          AuthController.prototype[method],
        ),
      ).toBeUndefined();
    });
  });

  it('delegates registration', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'password',
      confirmPassword: 'password',
      name: 'testuser',
    };

    await expect(controller.registerUser(dto)).resolves.toEqual({
      success: true,
    });
    expect(mockAuthService.registerUser).toHaveBeenCalledWith(dto);
  });

  it('delegates activation', async () => {
    const dto = { token: 'activation-token' };

    await expect(controller.activateUser(dto)).resolves.toEqual({
      success: true,
    });
    expect(mockAuthService.activateUser).toHaveBeenCalledWith(dto);
  });

  it('delegates login, forwards request headers, and applies response cookies', async () => {
    const dto = { credential: 'testuser', password: 'password' };
    const req = { headers: { cookie: 'existing=session' } };
    const reply = { header: jest.fn() };

    await expect(controller.login(dto, req, reply)).resolves.toEqual({
      user: { id: 'user-id-123', email: 'test@example.com' },
      rbac: [{ action: 'read', subject: 'all' }],
    });

    expect(mockAuthService.login).toHaveBeenCalledWith(
      dto,
      expect.any(Headers),
    );
    expect(reply.header).toHaveBeenCalledWith('set-cookie', [
      'better-auth.session=abc; Path=/; HttpOnly',
    ]);
  });

  it('delegates core session logout and applies response cookies', async () => {
    const dto = {};
    const req = { headers: { cookie: 'better-auth.session=abc' } };
    const reply = { header: jest.fn() };

    await expect(controller.logout(dto, req, reply)).resolves.toEqual({
      success: true,
    });
    expect(mockAuthService.logout).toHaveBeenCalledWith(
      dto,
      expect.any(Headers),
    );
    expect(reply.header).toHaveBeenCalledWith('set-cookie', [
      'better-auth.session=abc; Path=/; HttpOnly',
    ]);
  });

  it('delegates changePassword', async () => {
    const userId = 'user-id-123';
    const dto = {
      currentPassword: 'oldpass',
      newPassword: 'newpass',
      confirmPassword: 'newpass',
    };

    await expect(controller.changePassword(userId, dto)).resolves.toEqual({
      success: true,
    });
    expect(mockAuthService.changePassword).toHaveBeenCalledWith(userId, dto);
  });

  it('delegates forgotPassword', async () => {
    const dto = { email: 'test@example.com' };

    await expect(controller.forgotPassword(dto)).resolves.toEqual({
      success: true,
    });
    expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(dto);
  });

  it('delegates resetPassword', async () => {
    const dto = {
      token: 'reset-token',
      password: 'newpass',
      confirmPassword: 'newpass',
    };

    await expect(controller.resetPassword(dto)).resolves.toEqual({
      success: true,
    });
    expect(mockAuthService.resetPassword).toHaveBeenCalledWith(dto);
  });

  it('delegates verifyEmail', async () => {
    const dto = { token: 'verify-token' };

    await expect(controller.verifyEmail(dto)).resolves.toEqual({
      success: true,
    });
    expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(dto);
  });

  it('delegates updateEmail', async () => {
    const userId = 'user-id-123';
    const dto = { newEmail: 'new@example.com', password: 'password' };

    await expect(controller.updateEmail(userId, dto)).resolves.toEqual({
      success: true,
    });
    expect(mockAuthService.updateEmail).toHaveBeenCalledWith(userId, dto);
  });

  it('delegates getLoggedInUserInfo using request headers', async () => {
    const req = {
      headers: { cookie: 'better-auth.session=abc' },
    };

    await expect(controller.getLoggedInUserInfo(req)).resolves.toEqual({
      user: { id: 'user-id-123', email: 'test@example.com' },
      rbac: [
        {
          subject: 'Article',
          action: 'update',
          conditions: { authorId: 'user-id-123' },
        },
      ],
    });
    expect(mockAuthService.getLoggedInUserInfo).toHaveBeenCalledWith(
      expect.any(Headers),
    );
  });
});
