import { InjectAuthConfig, authConfig } from './auth.config';

const AUTH_ENV_KEYS = [
  'AUTH_ENCRYPTION_ALGORITHM',
  'AUTH_ENCRYPTION_KEY',
  'AUTH_MAILER_PROVIDER',
  'AUTH_BETTER_AUTH_BASE_URL',
  'AUTH_BETTER_AUTH_SECRET',
  'AUTH_BETTER_AUTH_VERIFY_EMAIL_CALLBACK_URL',
  'AUTH_BETTER_AUTH_RESET_PASSWORD_CALLBACK_URL',
  'AUTH_PLUGIN_JWT_ENABLED',
  'AUTH_PLUGIN_JWT_SECRET',
  'AUTH_PLUGIN_JWT_EXPIRATION',
  'AUTH_PLUGIN_JWT_AUDIENCE',
  'AUTH_PLUGIN_JWT_ISSUER',
  'AUTH_PLUGIN_PASSKEYS_ENABLED',
  'AUTH_PLUGIN_PASSKEY_RP_ID',
  'AUTH_PLUGIN_PASSKEY_RP_NAME',
  'AUTH_PLUGIN_PASSKEY_ORIGIN',
  'AUTH_PLUGIN_SOCIAL_ENABLED',
  'AUTH_PLUGIN_SOCIAL_GITHUB_CLIENT_ID',
  'AUTH_PLUGIN_SOCIAL_GITHUB_CLIENT_SECRET',
  'AUTH_PLUGIN_OIDC_ENABLED',
  'AUTH_JWT_SECRET',
  'AUTH_JWT_EXPIRATION',
  'AUTH_JWT_AUDIENCE',
  'AUTH_JWT_ISSUER',
  'AUTH_FEATURE_PASSKEYS',
  'AUTH_FEATURE_SOCIAL',
  'AUTH_FEATURE_OIDC',
  'AUTH_SOCIAL_GITHUB_CLIENT_ID',
  'AUTH_SOCIAL_GITHUB_CLIENT_SECRET',
  'AUTH_PASSKEY_RP_ID',
  'AUTH_PASSKEY_RP_NAME',
  'AUTH_PASSKEY_ORIGIN',
] as const;

type AuthEnvKey = (typeof AUTH_ENV_KEYS)[number];

const originalEnv: Record<AuthEnvKey, string | undefined> = AUTH_ENV_KEYS.reduce(
  (acc, key) => {
    acc[key] = process.env[key];
    return acc;
  },
  {} as Record<AuthEnvKey, string | undefined>,
);

describe('authConfig', () => {
  beforeEach(() => {
    AUTH_ENV_KEYS.forEach((key) => {
      delete process.env[key];
    });
  });

  afterEach(() => {
    AUTH_ENV_KEYS.forEach((key) => {
      const value = originalEnv[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  });

  it('returns Better Auth defaults with plugins disabled by default', () => {
    expect(authConfig()).toEqual({
      encryptionAlgorithm: 'bcrypt',
      encryptionKey: 'default_encryption_key',
      mailerProvider: 'node',
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
          github: {
            clientId: undefined,
            clientSecret: undefined,
          },
        },
        oidc: {
          enabled: false,
        },
      },
    });
  });

  it('maps plugin and Better Auth environment overrides', () => {
    process.env['AUTH_ENCRYPTION_KEY'] = 'enc-key';
    process.env['AUTH_MAILER_PROVIDER'] = 'noop';
    process.env['AUTH_BETTER_AUTH_BASE_URL'] =
      'http://localhost:3100/internal/auth';
    process.env['AUTH_BETTER_AUTH_SECRET'] =
      '0123456789abcdef0123456789abcdef';
    process.env['AUTH_BETTER_AUTH_VERIFY_EMAIL_CALLBACK_URL'] =
      'https://app.example.test/verify-email';
    process.env['AUTH_BETTER_AUTH_RESET_PASSWORD_CALLBACK_URL'] =
      'https://app.example.test/reset-password';
    process.env['AUTH_PLUGIN_JWT_ENABLED'] = 'true';
    process.env['AUTH_PLUGIN_JWT_SECRET'] = 'jwt-secret';
    process.env['AUTH_PLUGIN_JWT_EXPIRATION'] = '900s';
    process.env['AUTH_PLUGIN_JWT_AUDIENCE'] = 'aud';
    process.env['AUTH_PLUGIN_JWT_ISSUER'] = 'issuer';
    process.env['AUTH_PLUGIN_PASSKEYS_ENABLED'] = 'true';
    process.env['AUTH_PLUGIN_PASSKEY_RP_ID'] = 'example.test';
    process.env['AUTH_PLUGIN_PASSKEY_RP_NAME'] = 'Example Test';
    process.env['AUTH_PLUGIN_PASSKEY_ORIGIN'] = 'https://example.test';
    process.env['AUTH_PLUGIN_SOCIAL_ENABLED'] = 'true';
    process.env['AUTH_PLUGIN_SOCIAL_GITHUB_CLIENT_ID'] = 'github-client';
    process.env['AUTH_PLUGIN_SOCIAL_GITHUB_CLIENT_SECRET'] = 'github-secret';
    process.env['AUTH_PLUGIN_OIDC_ENABLED'] = 'true';

    expect(authConfig()).toEqual({
      encryptionAlgorithm: 'bcrypt',
      encryptionKey: 'enc-key',
      mailerProvider: 'noop',
      betterAuth: {
        baseUrl: 'http://localhost:3100/internal/auth',
        secret: '0123456789abcdef0123456789abcdef',
        callbackUrls: {
          verifyEmail: 'https://app.example.test/verify-email',
          resetPassword: 'https://app.example.test/reset-password',
        },
      },
      plugins: {
        jwt: {
          enabled: true,
          secret: 'jwt-secret',
          expiration: '900s',
          audience: 'aud',
          issuer: 'issuer',
        },
        passkeys: {
          enabled: true,
          rpID: 'example.test',
          rpName: 'Example Test',
          origin: 'https://example.test',
        },
        social: {
          enabled: true,
          github: {
            clientId: 'github-client',
            clientSecret: 'github-secret',
          },
        },
        oidc: {
          enabled: true,
        },
      },
    });
  });

  it('derives callback urls from the Better Auth base url when explicit overrides are absent', () => {
    process.env['AUTH_BETTER_AUTH_BASE_URL'] = 'http://localhost:3200/api/auth';
    process.env['AUTH_JWT_SECRET'] = 'legacy-jwt-secret';
    process.env['AUTH_JWT_EXPIRATION'] = '1200s';
    process.env['AUTH_JWT_AUDIENCE'] = 'legacy-aud';
    process.env['AUTH_JWT_ISSUER'] = 'legacy-issuer';
    process.env['AUTH_FEATURE_PASSKEYS'] = 'true';
    process.env['AUTH_FEATURE_SOCIAL'] = 'true';
    process.env['AUTH_FEATURE_OIDC'] = 'true';
    process.env['AUTH_SOCIAL_GITHUB_CLIENT_ID'] = 'legacy-client';
    process.env['AUTH_SOCIAL_GITHUB_CLIENT_SECRET'] = 'legacy-secret';
    process.env['AUTH_PASSKEY_RP_ID'] = 'legacy.test';
    process.env['AUTH_PASSKEY_RP_NAME'] = 'Legacy Test';
    process.env['AUTH_PASSKEY_ORIGIN'] = 'https://legacy.test';

    expect(authConfig()).toEqual({
      encryptionAlgorithm: 'bcrypt',
      encryptionKey: 'default_encryption_key',
      mailerProvider: 'node',
      betterAuth: {
        baseUrl: 'http://localhost:3200/api/auth',
        secret: 'better-auth-secret-32-chars-minimum',
        callbackUrls: {
          verifyEmail: 'http://localhost:3200/verify-email',
          resetPassword: 'http://localhost:3200/reset-password',
        },
      },
      plugins: {
        jwt: {
          enabled: false,
          secret: 'legacy-jwt-secret',
          expiration: '1200s',
          audience: 'legacy-aud',
          issuer: 'legacy-issuer',
        },
        passkeys: {
          enabled: true,
          rpID: 'legacy.test',
          rpName: 'Legacy Test',
          origin: 'https://legacy.test',
        },
        social: {
          enabled: true,
          github: {
            clientId: 'legacy-client',
            clientSecret: 'legacy-secret',
          },
        },
        oidc: {
          enabled: true,
        },
      },
    });
  });

  it('throws when AUTH_MAILER_PROVIDER is unsupported', () => {
    process.env['AUTH_MAILER_PROVIDER'] = 'invalid';

    expect(() => authConfig()).toThrow('Unsupported mailer provider: invalid');
  });

  it('throws when a plugin boolean env is invalid', () => {
    process.env['AUTH_PLUGIN_JWT_ENABLED'] = 'invalid';

    expect(() => authConfig()).toThrow('Unsupported boolean value: invalid');
  });

  it('exposes the expected configuration key', () => {
    expect(authConfig.KEY).toContain('auth');
  });
});

describe('InjectAuthConfig', () => {
  it('returns an injectable decorator factory', () => {
    expect(typeof InjectAuthConfig()).toBe('function');
  });
});
