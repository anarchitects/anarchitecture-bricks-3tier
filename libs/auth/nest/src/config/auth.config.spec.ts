import { InjectAuthConfig, authConfig } from './auth.config';

const AUTH_ENV_KEYS = [
  'AUTH_JWT_SECRET',
  'AUTH_JWT_EXPIRATION',
  'AUTH_JWT_AUDIENCE',
  'AUTH_JWT_ISSUER',
  'AUTH_ENCRYPTION_ALGORITHM',
  'AUTH_ENCRYPTION_KEY',
  'AUTH_PERSISTENCE',
  'AUTH_MAILER_PROVIDER',
  'AUTH_STRATEGIES',
  'AUTH_ENGINE',
  'AUTH_SESSION_MODE',
  'AUTH_ENGINE_PERSISTENCE_MODE',
  'AUTH_ENGINE_ISOLATED_TOPOLOGY',
  'AUTH_ENGINE_SEPARATE_DB_HOST',
  'AUTH_ENGINE_SEPARATE_DB_PORT',
  'AUTH_ENGINE_SEPARATE_DB_USERNAME',
  'AUTH_ENGINE_SEPARATE_DB_PASSWORD',
  'AUTH_ENGINE_SEPARATE_DB_DATABASE',
  'AUTH_ENGINE_SEPARATE_DB_SSL',
  'AUTH_FEATURE_PASSKEYS',
  'AUTH_FEATURE_SOCIAL',
  'AUTH_FEATURE_OIDC',
  'AUTH_SPIKE_BASE_URL',
  'AUTH_SPIKE_SECRET',
  'AUTH_SPIKE_PROOF_HARNESS',
  'AUTH_SOCIAL_GITHUB_CLIENT_ID',
  'AUTH_SOCIAL_GITHUB_CLIENT_SECRET',
  'AUTH_PASSKEY_RP_ID',
  'AUTH_PASSKEY_RP_NAME',
  'AUTH_PASSKEY_ORIGIN',
] as const;

type AuthEnvKey = (typeof AUTH_ENV_KEYS)[number];

const originalEnv: Record<AuthEnvKey, string | undefined> =
  AUTH_ENV_KEYS.reduce(
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

  it('returns default values when no environment variables are set', () => {
    expect(authConfig()).toEqual({
      jwtSecret: 'default_jwt_secret',
      jwtExpiration: '3600s',
      jwtAudience: 'your_audience',
      jwtIssuer: 'your_issuer',
      encryptionAlgorithm: 'bcrypt',
      encryptionKey: 'default_encryption_key',
      persistence: 'typeorm',
      mailerProvider: 'node',
      authStrategies: ['jwt'],
      engine: 'legacy-jwt',
      sessionMode: 'jwt',
      engineOptions: {
        persistence: {
          mode: 'isolated',
          isolatedTopology: 'same-db',
          separateDatabase: {
            host: undefined,
            port: 5432,
            username: undefined,
            password: undefined,
            database: undefined,
            ssl: false,
          },
        },
      },
      features: {
        passkeys: false,
        social: false,
        oidc: false,
      },
      spike: {
        baseUrl: 'http://localhost:3000/api/auth',
        secret: 'better-auth-spike-secret-32-chars-minimum',
        proofHarnessEnabled: false,
        socialProviders: {
          github: {
            clientId: undefined,
            clientSecret: undefined,
          },
        },
        passkeys: {
          rpID: 'localhost',
          rpName: 'Anarchitecture Auth Spike',
          origin: undefined,
        },
      },
    });
  });

  it('uses provided environment variables when available', () => {
    process.env['AUTH_JWT_SECRET'] = 'jwt-secret';
    process.env['AUTH_JWT_EXPIRATION'] = '900s';
    process.env['AUTH_JWT_AUDIENCE'] = 'aud';
    process.env['AUTH_JWT_ISSUER'] = 'issuer';
    process.env['AUTH_ENCRYPTION_ALGORITHM'] = 'bcrypt';
    process.env['AUTH_ENCRYPTION_KEY'] = 'enc-key';
    process.env['AUTH_PERSISTENCE'] = 'typeorm';
    process.env['AUTH_MAILER_PROVIDER'] = 'noop';
    process.env['AUTH_STRATEGIES'] = 'jwt, custom';
    process.env['AUTH_ENGINE'] = 'better-auth';
    process.env['AUTH_SESSION_MODE'] = 'session';
    process.env['AUTH_ENGINE_PERSISTENCE_MODE'] = 'typeorm-adapter';
    process.env['AUTH_ENGINE_ISOLATED_TOPOLOGY'] = 'separate-db';
    process.env['AUTH_ENGINE_SEPARATE_DB_HOST'] = 'db.example.test';
    process.env['AUTH_ENGINE_SEPARATE_DB_PORT'] = '6543';
    process.env['AUTH_ENGINE_SEPARATE_DB_USERNAME'] = 'auth_user';
    process.env['AUTH_ENGINE_SEPARATE_DB_PASSWORD'] = 'auth_pass';
    process.env['AUTH_ENGINE_SEPARATE_DB_DATABASE'] = 'auth_db';
    process.env['AUTH_ENGINE_SEPARATE_DB_SSL'] = 'true';
    process.env['AUTH_FEATURE_PASSKEYS'] = 'true';
    process.env['AUTH_FEATURE_SOCIAL'] = 'true';
    process.env['AUTH_FEATURE_OIDC'] = 'false';
    process.env['AUTH_SPIKE_BASE_URL'] = 'http://localhost:3100/internal/auth';
    process.env['AUTH_SPIKE_SECRET'] = '0123456789abcdef0123456789abcdef';
    process.env['AUTH_SPIKE_PROOF_HARNESS'] = 'true';
    process.env['AUTH_SOCIAL_GITHUB_CLIENT_ID'] = 'github-client';
    process.env['AUTH_SOCIAL_GITHUB_CLIENT_SECRET'] = 'github-secret';
    process.env['AUTH_PASSKEY_RP_ID'] = 'example.test';
    process.env['AUTH_PASSKEY_RP_NAME'] = 'Example Test';
    process.env['AUTH_PASSKEY_ORIGIN'] = 'https://example.test';

    expect(authConfig()).toEqual({
      jwtSecret: 'jwt-secret',
      jwtExpiration: '900s',
      jwtAudience: 'aud',
      jwtIssuer: 'issuer',
      encryptionAlgorithm: 'bcrypt',
      encryptionKey: 'enc-key',
      persistence: 'typeorm',
      mailerProvider: 'noop',
      authStrategies: ['jwt', 'custom'],
      engine: 'better-auth',
      sessionMode: 'session',
      engineOptions: {
        persistence: {
          mode: 'typeorm-adapter',
          isolatedTopology: 'separate-db',
          separateDatabase: {
            host: 'db.example.test',
            port: 6543,
            username: 'auth_user',
            password: 'auth_pass',
            database: 'auth_db',
            ssl: true,
          },
        },
      },
      features: {
        passkeys: true,
        social: true,
        oidc: false,
      },
      spike: {
        baseUrl: 'http://localhost:3100/internal/auth',
        secret: '0123456789abcdef0123456789abcdef',
        proofHarnessEnabled: true,
        socialProviders: {
          github: {
            clientId: 'github-client',
            clientSecret: 'github-secret',
          },
        },
        passkeys: {
          rpID: 'example.test',
          rpName: 'Example Test',
          origin: 'https://example.test',
        },
      },
    });
  });

  it('throws when AUTH_MAILER_PROVIDER is unsupported', () => {
    process.env['AUTH_MAILER_PROVIDER'] = 'invalid';

    expect(() => authConfig()).toThrow('Unsupported mailer provider: invalid');
  });

  it('throws when AUTH_ENGINE is unsupported', () => {
    process.env['AUTH_ENGINE'] = 'invalid';

    expect(() => authConfig()).toThrow('Unsupported auth engine: invalid');
  });

  it('throws when AUTH_ENGINE_PERSISTENCE_MODE is unsupported', () => {
    process.env['AUTH_ENGINE_PERSISTENCE_MODE'] = 'invalid';

    expect(() => authConfig()).toThrow(
      'Unsupported auth engine persistence mode: invalid',
    );
  });

  it('throws when AUTH_ENGINE_ISOLATED_TOPOLOGY is unsupported', () => {
    process.env['AUTH_ENGINE_ISOLATED_TOPOLOGY'] = 'invalid';

    expect(() => authConfig()).toThrow(
      'Unsupported auth engine isolated topology: invalid',
    );
  });

  it('throws when AUTH_ENGINE_SEPARATE_DB_PORT is invalid', () => {
    process.env['AUTH_ENGINE_SEPARATE_DB_PORT'] = 'invalid';

    expect(() => authConfig()).toThrow('Unsupported integer value: invalid');
  });

  it('falls back to default strategies when AUTH_STRATEGIES is empty', () => {
    process.env['AUTH_STRATEGIES'] = ' ,  ';

    const config = authConfig();
    expect(config.authStrategies).toEqual(['jwt']);
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
