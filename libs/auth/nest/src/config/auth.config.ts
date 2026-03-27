import { Inject } from '@nestjs/common';
import { ConfigType, registerAs } from '@nestjs/config';
import type { CommonMailerProvider } from '@anarchitects/common-nest-mailer';

const AUTH_CONFIG_KEY = 'auth';
export const DEFAULT_AUTH_JWT_SECRET = 'default_jwt_secret';
export const DEFAULT_AUTH_JWT_EXPIRATION = '3600s';
export const DEFAULT_AUTH_JWT_AUDIENCE = 'your_audience';
export const DEFAULT_AUTH_JWT_ISSUER = 'your_issuer';
export const DEFAULT_AUTH_ENCRYPTION_ALGORITHM = 'bcrypt';
export const DEFAULT_AUTH_ENCRYPTION_KEY = 'default_encryption_key';
export const DEFAULT_AUTH_PERSISTENCE = 'typeorm';
export const DEFAULT_AUTH_MAILER_PROVIDER = 'node';
export const DEFAULT_AUTH_STRATEGIES = ['jwt'] as const;
export const DEFAULT_AUTH_ENGINE = 'legacy-jwt';
export const DEFAULT_AUTH_SESSION_MODE = 'jwt';
export const DEFAULT_AUTH_ENGINE_PERSISTENCE_MODE = 'isolated';
export const DEFAULT_AUTH_ENGINE_ISOLATED_TOPOLOGY = 'same-db';
export const DEFAULT_AUTH_ENGINE_SEPARATE_DB_PORT = 5432;
export const DEFAULT_AUTH_ENGINE_SEPARATE_DB_SSL = false;

const parseBoolean = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) {
    return fallback;
  }

  switch (value.trim().toLowerCase()) {
    case '1':
    case 'true':
    case 'yes':
    case 'on':
      return true;
    case '0':
    case 'false':
    case 'no':
    case 'off':
      return false;
    default:
      throw new Error(`Unsupported boolean value: ${value}`);
  }
};

const parseInteger = (value: string | undefined, fallback: number): number => {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Unsupported integer value: ${value}`);
  }

  return parsed;
};

const parseMailerProvider = (): CommonMailerProvider => {
  const value = process.env['AUTH_MAILER_PROVIDER'];
  if (value === undefined) {
    return DEFAULT_AUTH_MAILER_PROVIDER;
  }

  switch (value) {
    case 'node':
    case 'noop':
      return value;
    default:
      throw new Error(`Unsupported mailer provider: ${value}`);
  }
};

const parseAuthStrategies = (): string[] => {
  const raw = process.env['AUTH_STRATEGIES'];
  if (!raw) {
    return [...DEFAULT_AUTH_STRATEGIES];
  }

  const parsed = raw
    .split(',')
    .map((strategy) => strategy.trim())
    .filter((strategy) => strategy.length > 0);

  return parsed.length > 0 ? parsed : [...DEFAULT_AUTH_STRATEGIES];
};

const parseAuthEngine = (): 'legacy-jwt' | 'better-auth' => {
  const value = process.env['AUTH_ENGINE'];
  if (value === undefined) {
    return DEFAULT_AUTH_ENGINE;
  }

  switch (value) {
    case 'legacy-jwt':
    case 'better-auth':
      return value;
    default:
      throw new Error(`Unsupported auth engine: ${value}`);
  }
};

const parseSessionMode = (): 'jwt' | 'session' => {
  const value = process.env['AUTH_SESSION_MODE'];
  if (value === undefined) {
    return DEFAULT_AUTH_SESSION_MODE;
  }

  switch (value) {
    case 'jwt':
    case 'session':
      return value;
    default:
      throw new Error(`Unsupported auth session mode: ${value}`);
  }
};

const parseAuthEnginePersistenceMode = (): 'isolated' | 'typeorm-adapter' => {
  const value = process.env['AUTH_ENGINE_PERSISTENCE_MODE'];
  if (value === undefined) {
    return DEFAULT_AUTH_ENGINE_PERSISTENCE_MODE;
  }

  switch (value) {
    case 'isolated':
    case 'typeorm-adapter':
      return value;
    default:
      throw new Error(`Unsupported auth engine persistence mode: ${value}`);
  }
};

const parseAuthEngineIsolatedTopology = (): 'same-db' | 'separate-db' => {
  const value = process.env['AUTH_ENGINE_ISOLATED_TOPOLOGY'];
  if (value === undefined) {
    return DEFAULT_AUTH_ENGINE_ISOLATED_TOPOLOGY;
  }

  switch (value) {
    case 'same-db':
    case 'separate-db':
      return value;
    default:
      throw new Error(`Unsupported auth engine isolated topology: ${value}`);
  }
};

export const authConfig = registerAs(AUTH_CONFIG_KEY, () => ({
  jwtSecret: process.env['AUTH_JWT_SECRET'] ?? DEFAULT_AUTH_JWT_SECRET,
  jwtExpiration:
    process.env['AUTH_JWT_EXPIRATION'] ?? DEFAULT_AUTH_JWT_EXPIRATION,
  jwtAudience: process.env['AUTH_JWT_AUDIENCE'] ?? DEFAULT_AUTH_JWT_AUDIENCE,
  jwtIssuer: process.env['AUTH_JWT_ISSUER'] ?? DEFAULT_AUTH_JWT_ISSUER,
  encryptionAlgorithm:
    process.env['AUTH_ENCRYPTION_ALGORITHM'] ??
    DEFAULT_AUTH_ENCRYPTION_ALGORITHM,
  encryptionKey:
    process.env['AUTH_ENCRYPTION_KEY'] ?? DEFAULT_AUTH_ENCRYPTION_KEY,
  persistence: process.env['AUTH_PERSISTENCE'] ?? DEFAULT_AUTH_PERSISTENCE,
  mailerProvider: parseMailerProvider(),
  authStrategies: parseAuthStrategies(),
  engine: parseAuthEngine(),
  sessionMode: parseSessionMode(),
  engineOptions: {
    persistence: {
      mode: parseAuthEnginePersistenceMode(),
      isolatedTopology: parseAuthEngineIsolatedTopology(),
      separateDatabase: {
        host: process.env['AUTH_ENGINE_SEPARATE_DB_HOST'],
        port: parseInteger(
          process.env['AUTH_ENGINE_SEPARATE_DB_PORT'],
          DEFAULT_AUTH_ENGINE_SEPARATE_DB_PORT,
        ),
        username: process.env['AUTH_ENGINE_SEPARATE_DB_USERNAME'],
        password: process.env['AUTH_ENGINE_SEPARATE_DB_PASSWORD'],
        database: process.env['AUTH_ENGINE_SEPARATE_DB_DATABASE'],
        ssl: parseBoolean(
          process.env['AUTH_ENGINE_SEPARATE_DB_SSL'],
          DEFAULT_AUTH_ENGINE_SEPARATE_DB_SSL,
        ),
      },
    },
  },
  features: {
    passkeys: parseBoolean(process.env['AUTH_FEATURE_PASSKEYS']),
    social: parseBoolean(process.env['AUTH_FEATURE_SOCIAL']),
    oidc: parseBoolean(process.env['AUTH_FEATURE_OIDC']),
  },
  spike: {
    baseUrl:
      process.env['AUTH_SPIKE_BASE_URL'] ?? 'http://localhost:3000/api/auth',
    secret:
      process.env['AUTH_SPIKE_SECRET'] ??
      'better-auth-spike-secret-32-chars-minimum',
    proofHarnessEnabled: parseBoolean(process.env['AUTH_SPIKE_PROOF_HARNESS']),
    socialProviders: {
      github: {
        clientId: process.env['AUTH_SOCIAL_GITHUB_CLIENT_ID'],
        clientSecret: process.env['AUTH_SOCIAL_GITHUB_CLIENT_SECRET'],
      },
    },
    passkeys: {
      rpID: process.env['AUTH_PASSKEY_RP_ID'] ?? 'localhost',
      rpName:
        process.env['AUTH_PASSKEY_RP_NAME'] ?? 'Anarchitecture Auth Spike',
      origin: process.env['AUTH_PASSKEY_ORIGIN'],
    },
  },
}));

export type AuthConfig = ConfigType<typeof authConfig>;

export const InjectAuthConfig = () => Inject(authConfig.KEY);
