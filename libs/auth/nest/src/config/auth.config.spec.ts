import { InjectAuthConfig, authConfig } from './auth.config';

const AUTH_ENV_KEYS = [
  'AUTH_JWT_SECRET',
  'AUTH_JWT_EXPIRATION',
  'AUTH_JWT_AUDIENCE',
  'AUTH_JWT_ISSUER',
  'AUTH_ENCRYPTION_ALGORITHM',
  'AUTH_ENCRYPTION_KEY',
  'AUTH_PERSISTENCE',
  'AUTH_MAILER_ENABLED',
  'AUTH_STRATEGIES',
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
      mailerEnabled: true,
      authStrategies: ['jwt'],
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
    process.env['AUTH_MAILER_ENABLED'] = 'false';
    process.env['AUTH_STRATEGIES'] = 'jwt, custom';

    expect(authConfig()).toEqual({
      jwtSecret: 'jwt-secret',
      jwtExpiration: '900s',
      jwtAudience: 'aud',
      jwtIssuer: 'issuer',
      encryptionAlgorithm: 'bcrypt',
      encryptionKey: 'enc-key',
      persistence: 'typeorm',
      mailerEnabled: false,
      authStrategies: ['jwt', 'custom'],
    });
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
