import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import type { InjectOptions, Response as InjectResponse } from 'light-my-request';
import {
  resolveAuthContractConfig,
  type AuthContractConfigOverrides,
} from '../../config';
import { AuthService } from '../../application/services/auth.service';
import { applyAuthControllerContractRouteSchemas } from '../auth-controller-route-schemas';
import {
  createAuthContractsFromConfig,
  createDefaultAuthContracts,
} from '../auth-contracts';
import { AuthController } from './auth.controller';

type MockAuthService = {
  registerUser: jest.Mock<Promise<{ success: boolean }>, [unknown]>;
  activateUser: jest.Mock<Promise<{ success: boolean }>, [unknown]>;
  login: jest.Mock<
    Promise<{
      body: {
        user: { id: string; email: string };
        rbac: Array<{ action: string; subject: string }>;
      };
      headers: Headers;
    }>,
    [unknown, Headers?]
  >;
  logout: jest.Mock<
    Promise<{ body: { success: boolean }; headers: Headers }>,
    [unknown, Headers?]
  >;
  changePassword: jest.Mock<Promise<{ success: boolean }>, [string, unknown]>;
  forgotPassword: jest.Mock<Promise<{ success: boolean }>, [unknown]>;
  resetPassword: jest.Mock<Promise<{ success: boolean }>, [unknown]>;
  verifyEmail: jest.Mock<Promise<{ success: boolean }>, [unknown]>;
  updateEmail: jest.Mock<Promise<{ success: boolean }>, [string, unknown]>;
  getLoggedInUserInfo: jest.Mock<
    Promise<{
      body: {
        user: { id: string; email: string };
        rbac: Array<{ action: string; subject: string }>;
      };
      headers: Headers;
    }>,
    [Headers?]
  >;
};

type AppHarness = {
  app: NestFastifyApplication;
  authService: MockAuthService;
};

const sessionHeaders = new Headers({
  'set-cookie': 'better-auth.session=abc; Path=/; HttpOnly',
});

const defaultLoginBody = {
  user: { id: 'user-id-123', email: 'test@example.com' },
  rbac: [{ action: 'read', subject: 'all' }],
};

const CUSTOM_CONTRACT_OVERRIDES: AuthContractConfigOverrides = {
  register: {
    name: {
      required: true,
    },
  },
  login: {
    password: {
      required: false,
    },
  },
  forgotPassword: {
    email: {
      required: false,
    },
  },
  resetPassword: {
    token: {
      required: false,
    },
  },
  verifyEmail: {
    token: {
      required: false,
    },
  },
  changePassword: {
    confirmPassword: {
      required: false,
    },
  },
};

const createMockAuthService = (): MockAuthService => ({
  registerUser: jest.fn().mockResolvedValue({ success: true }),
  activateUser: jest.fn().mockResolvedValue({ success: true }),
  login: jest.fn().mockResolvedValue({
    body: defaultLoginBody,
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
    body: defaultLoginBody,
    headers: sessionHeaders,
  }),
});

const applyDefaultContracts = (): void => {
  applyAuthControllerContractRouteSchemas(
    AuthController,
    createDefaultAuthContracts(),
  );
};

const applyContracts = (overrides?: AuthContractConfigOverrides): void => {
  const resolvedConfig = resolveAuthContractConfig(overrides);
  const contracts = createAuthContractsFromConfig(resolvedConfig);

  applyAuthControllerContractRouteSchemas(AuthController, contracts);
};

const createApp = async (
  overrides?: AuthContractConfigOverrides,
): Promise<AppHarness> => {
  applyContracts(overrides);

  const authService = createMockAuthService();
  const moduleRef = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [{ provide: AuthService, useValue: authService }],
  }).compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({ logger: false }),
  );

  app.useLogger(false);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return { app, authService };
};

const parseJson = (response: InjectResponse): Record<string, unknown> =>
  JSON.parse(response.body) as Record<string, unknown>;

const expectValidationFailure = (response: InjectResponse): void => {
  expect(response.statusCode).toBe(400);

  const body = parseJson(response);

  expect(body).toEqual(
    expect.objectContaining({
      statusCode: 400,
      message: expect.any(String),
    }),
  );
  expect(body['message']).toEqual(expect.stringContaining('body'));
};

const injectJson = (
  app: NestFastifyApplication,
  options: InjectOptions,
): Promise<InjectResponse> =>
  app.inject({
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

describe('AuthController Fastify contract integration', () => {
  let app: NestFastifyApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
    applyDefaultContracts();
  });

  describe('POST /auth/register', () => {
    it('accepts a valid default payload', async () => {
      const harness = await createApp();
      app = harness.app;

      const payload = {
        email: 'test@example.com',
        password: 'password',
        confirmPassword: 'password',
        name: 'Test User',
      };

      const response = await injectJson(app, {
        method: 'POST',
        url: '/auth/register',
        payload,
      });

      expect(response.statusCode).toBe(200);
      expect(parseJson(response)).toEqual({ success: true });
      expect(harness.authService.registerUser).toHaveBeenCalledWith(payload);
    });

    it('rejects a too-short default password with 400', async () => {
      const harness = await createApp();
      app = harness.app;

      const response = await injectJson(app, {
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
          password: '12345',
          confirmPassword: '12345',
          name: 'Test User',
        },
      });

      expectValidationFailure(response);
      expect(harness.authService.registerUser).not.toHaveBeenCalled();
    });

    it('accepts omitted optional name under the default profile', async () => {
      const harness = await createApp();
      app = harness.app;

      const payload = {
        email: 'test@example.com',
        password: 'password',
        confirmPassword: 'password',
      };

      const response = await injectJson(app, {
        method: 'POST',
        url: '/auth/register',
        payload,
      });

      expect(response.statusCode).toBe(200);
      expect(parseJson(response)).toEqual({ success: true });
      expect(harness.authService.registerUser).toHaveBeenCalledWith(payload);
    });

    it('rejects omitted name when the override marks it required', async () => {
      const harness = await createApp(CUSTOM_CONTRACT_OVERRIDES);
      app = harness.app;

      const response = await injectJson(app, {
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'password',
          confirmPassword: 'password',
        },
      });

      expectValidationFailure(response);
      expect(harness.authService.registerUser).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/login', () => {
    it('accepts a valid default payload', async () => {
      const harness = await createApp();
      app = harness.app;

      const payload = {
        credential: 'test@example.com',
        password: 'password',
      };

      const response = await injectJson(app, {
        method: 'POST',
        url: '/auth/login',
        payload,
      });

      expect(response.statusCode).toBe(200);
      expect(parseJson(response)).toEqual(defaultLoginBody);
      expect(harness.authService.login).toHaveBeenCalledWith(
        payload,
        expect.any(Headers),
      );
    });

    it('rejects a too-short default password with 400', async () => {
      const harness = await createApp();
      app = harness.app;

      const response = await injectJson(app, {
        method: 'POST',
        url: '/auth/login',
        payload: {
          credential: 'test@example.com',
          password: '12345',
        },
      });

      expectValidationFailure(response);
      expect(harness.authService.login).not.toHaveBeenCalled();
    });

    it('accepts omitted password when the override marks it optional', async () => {
      const harness = await createApp(CUSTOM_CONTRACT_OVERRIDES);
      app = harness.app;

      const payload = {
        credential: 'test@example.com',
      };

      const response = await injectJson(app, {
        method: 'POST',
        url: '/auth/login',
        payload,
      });

      expect(response.statusCode).toBe(200);
      expect(parseJson(response)).toEqual(defaultLoginBody);
      expect(harness.authService.login).toHaveBeenCalledWith(
        payload,
        expect.any(Headers),
      );
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('accepts a valid default payload', async () => {
      const harness = await createApp();
      app = harness.app;

      const payload = { email: 'test@example.com' };

      const response = await injectJson(app, {
        method: 'POST',
        url: '/auth/forgot-password',
        payload,
      });

      expect(response.statusCode).toBe(200);
      expect(parseJson(response)).toEqual({ success: true });
      expect(harness.authService.forgotPassword).toHaveBeenCalledWith(payload);
    });

    it('rejects a malformed default email with 400', async () => {
      const harness = await createApp();
      app = harness.app;

      const response = await injectJson(app, {
        method: 'POST',
        url: '/auth/forgot-password',
        payload: { email: 'not-an-email' },
      });

      expectValidationFailure(response);
      expect(harness.authService.forgotPassword).not.toHaveBeenCalled();
    });

    it('accepts omitted email when the override marks it optional', async () => {
      const harness = await createApp(CUSTOM_CONTRACT_OVERRIDES);
      app = harness.app;

      const payload = {};

      const response = await injectJson(app, {
        method: 'POST',
        url: '/auth/forgot-password',
        payload,
      });

      expect(response.statusCode).toBe(200);
      expect(parseJson(response)).toEqual({ success: true });
      expect(harness.authService.forgotPassword).toHaveBeenCalledWith(payload);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('accepts a valid default payload', async () => {
      const harness = await createApp();
      app = harness.app;

      const payload = {
        token: 'reset-token',
        password: 'password',
        confirmPassword: 'password',
      };

      const response = await injectJson(app, {
        method: 'POST',
        url: '/auth/reset-password',
        payload,
      });

      expect(response.statusCode).toBe(200);
      expect(parseJson(response)).toEqual({ success: true });
      expect(harness.authService.resetPassword).toHaveBeenCalledWith(payload);
    });

    it('rejects an empty default token with 400', async () => {
      const harness = await createApp();
      app = harness.app;

      const response = await injectJson(app, {
        method: 'POST',
        url: '/auth/reset-password',
        payload: {
          token: '',
          password: 'password',
          confirmPassword: 'password',
        },
      });

      expectValidationFailure(response);
      expect(harness.authService.resetPassword).not.toHaveBeenCalled();
    });

    it('accepts omitted token when the override marks it optional', async () => {
      const harness = await createApp(CUSTOM_CONTRACT_OVERRIDES);
      app = harness.app;

      const payload = {
        password: 'password',
        confirmPassword: 'password',
      };

      const response = await injectJson(app, {
        method: 'POST',
        url: '/auth/reset-password',
        payload,
      });

      expect(response.statusCode).toBe(200);
      expect(parseJson(response)).toEqual({ success: true });
      expect(harness.authService.resetPassword).toHaveBeenCalledWith(payload);
    });
  });

  describe('POST /auth/verify-email', () => {
    it('accepts a valid default payload', async () => {
      const harness = await createApp();
      app = harness.app;

      const payload = { token: 'verify-token' };

      const response = await injectJson(app, {
        method: 'POST',
        url: '/auth/verify-email',
        payload,
      });

      expect(response.statusCode).toBe(200);
      expect(parseJson(response)).toEqual({ success: true });
      expect(harness.authService.verifyEmail).toHaveBeenCalledWith(payload);
    });

    it('rejects an empty default token with 400', async () => {
      const harness = await createApp();
      app = harness.app;

      const response = await injectJson(app, {
        method: 'POST',
        url: '/auth/verify-email',
        payload: { token: '' },
      });

      expectValidationFailure(response);
      expect(harness.authService.verifyEmail).not.toHaveBeenCalled();
    });

    it('accepts omitted token when the override marks it optional', async () => {
      const harness = await createApp(CUSTOM_CONTRACT_OVERRIDES);
      app = harness.app;

      const payload = {};

      const response = await injectJson(app, {
        method: 'POST',
        url: '/auth/verify-email',
        payload,
      });

      expect(response.statusCode).toBe(200);
      expect(parseJson(response)).toEqual({ success: true });
      expect(harness.authService.verifyEmail).toHaveBeenCalledWith(payload);
    });
  });

  describe('PATCH /auth/change-password/:userId', () => {
    it('accepts a valid default payload', async () => {
      const harness = await createApp();
      app = harness.app;

      const payload = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
        confirmPassword: 'newpassword',
      };

      const response = await injectJson(app, {
        method: 'PATCH',
        url: '/auth/change-password/user-id-123',
        payload,
      });

      expect(response.statusCode).toBe(200);
      expect(parseJson(response)).toEqual({ success: true });
      expect(harness.authService.changePassword).toHaveBeenCalledWith(
        'user-id-123',
        payload,
      );
    });

    it('rejects a too-short default newPassword with 400', async () => {
      const harness = await createApp();
      app = harness.app;

      const response = await injectJson(app, {
        method: 'PATCH',
        url: '/auth/change-password/user-id-123',
        payload: {
          currentPassword: 'oldpassword',
          newPassword: '12345',
          confirmPassword: '12345',
        },
      });

      expectValidationFailure(response);
      expect(harness.authService.changePassword).not.toHaveBeenCalled();
    });

    it('accepts omitted confirmPassword when the override marks it optional', async () => {
      const harness = await createApp(CUSTOM_CONTRACT_OVERRIDES);
      app = harness.app;

      const payload = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
      };

      const response = await injectJson(app, {
        method: 'PATCH',
        url: '/auth/change-password/user-id-123',
        payload,
      });

      expect(response.statusCode).toBe(200);
      expect(parseJson(response)).toEqual({ success: true });
      expect(harness.authService.changePassword).toHaveBeenCalledWith(
        'user-id-123',
        payload,
      );
    });
  });
});
