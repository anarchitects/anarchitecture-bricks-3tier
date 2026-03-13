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
}));

export type AuthConfig = ConfigType<typeof authConfig>;

export const InjectAuthConfig = () => Inject(authConfig.KEY);
