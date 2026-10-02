import type { BetterAuthOptions } from 'better-auth';
import type { ResolvedAuthApplicationModuleOptions } from '../../config';
import { createBetterAuthOptions } from './better-auth-options';
import type { BetterAuthRuntimeModules } from './better-auth.module-loader';

const baseOptions = {
  betterAuth: {
    baseUrl: 'http://localhost:3000/api/auth',
    secret: 'better-auth-secret-32-chars-minimum',
    callbackUrls: {
      verifyEmail: 'http://localhost:3000/verify-email',
      resetPassword: 'http://localhost:3000/reset-password',
    },
  },
  plugins: {
    jwt: {
      enabled: false,
      secret: 'default_jwt_secret',
      expiration: '3600s',
      audience: 'your_audience',
      issuer: 'your_issuer',
    },
    passkeys: {
      enabled: false,
      rpID: 'localhost',
      rpName: 'Anarchitecture Auth',
      origin: undefined,
    },
    social: {
      enabled: false,
      github: undefined,
    },
    oidc: {
      enabled: false,
    },
  },
  encryption: {
    algorithm: 'bcrypt',
    key: 'default_encryption_key',
  },
  resourceAuthorization: {
    loaders: {},
  },
} satisfies ResolvedAuthApplicationModuleOptions;

const runtimeModules = {
  betterAuth: {} as BetterAuthRuntimeModules['betterAuth'],
  betterAuthAdapters: {} as BetterAuthRuntimeModules['betterAuthAdapters'],
  betterAuthPasskey: {
    passkey: jest.fn().mockReturnValue({ id: 'passkey-plugin' }),
  } as unknown as BetterAuthRuntimeModules['betterAuthPasskey'],
  betterAuthMigration: {} as BetterAuthRuntimeModules['betterAuthMigration'],
} satisfies BetterAuthRuntimeModules;

const lifecycle = {
  hashPassword: jest.fn(async (password: string) => `hashed:${password}`),
  verifyPassword: jest.fn(async () => true),
  sendVerificationEmail: jest.fn(async () => undefined),
  sendResetPassword: jest.fn(async () => undefined),
};

describe('createBetterAuthOptions', () => {
  it('pins the browser origin and trusts an explicitly configured frontend origin', () => {
    const options = createBetterAuthOptions(
      {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          passkeys: {
            enabled: true,
            rpID: 'example.com',
            rpName: 'Example',
            origin: 'https://login.example.com',
          },
        },
      },
      {} as BetterAuthOptions['database'],
      runtimeModules,
      lifecycle,
    );
    expect(runtimeModules.betterAuthPasskey.passkey).toHaveBeenLastCalledWith(
      expect.objectContaining({
        origin: 'https://login.example.com',
        registration: { requireSession: true },
      }),
    );
    expect(options.trustedOrigins).toContain('https://login.example.com');
  });

  it.each([
    'https://example.com/path',
    'https://user:password@example.com',
    'https://example.com?x=1',
    'https://example.com#fragment',
    'file:///tmp/test',
    'https://attacker.test',
  ])('rejects invalid origin policy %s', (origin) => {
    expect(() =>
      createBetterAuthOptions(
        {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            passkeys: {
              enabled: true,
              rpID: 'example.com',
              rpName: 'Example',
              origin,
            },
          },
        },
        {} as BetterAuthOptions['database'],
        runtimeModules,
        lifecycle,
      ),
    ).toThrow();
  });

  it('configures Better Auth to generate UUID ids for the host schema', () => {
    const options = createBetterAuthOptions(
      baseOptions,
      {} as BetterAuthOptions['database'],
      runtimeModules,
      lifecycle,
    );

    expect(options.advanced?.database).toEqual({
      generateId: 'uuid',
    });
  });

  it('adds the passkey plugin only when enabled', () => {
    const disabled = createBetterAuthOptions(
      baseOptions,
      {} as BetterAuthOptions['database'],
      runtimeModules,
      lifecycle,
    );
    expect(disabled.plugins).toEqual([]);

    const enabled = createBetterAuthOptions(
      {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          passkeys: {
            ...baseOptions.plugins.passkeys,
            enabled: true,
          },
        },
      },
      {} as BetterAuthOptions['database'],
      runtimeModules,
      lifecycle,
    );

    expect(runtimeModules.betterAuthPasskey.passkey).toHaveBeenCalledWith({
      rpID: 'localhost',
      rpName: 'Anarchitecture Auth',
      origin: 'http://localhost:3000',
      registration: { requireSession: true },
      schema: {
        passkey: {
          modelName: 'passkeys',
        },
      },
    });
    expect(enabled.plugins).toEqual([{ id: 'passkey-plugin' }]);
  });
});
