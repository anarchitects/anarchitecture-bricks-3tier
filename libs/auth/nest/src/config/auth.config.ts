import { Inject } from '@nestjs/common';
import { ConfigType, registerAs } from '@nestjs/config';

const AUTH_CONFIG_KEY = 'auth';

export const authConfig = registerAs(AUTH_CONFIG_KEY, () => ({
  jwtSecret: process.env['AUTH_JWT_SECRET'] || 'default_jwt_secret',
  jwtExpiration: process.env['AUTH_JWT_EXPIRATION'] || '3600s',
  jwtAudience: process.env['AUTH_JWT_AUDIENCE'] || 'your_audience',
  jwtIssuer: process.env['AUTH_JWT_ISSUER'] || 'your_issuer',
  encryptionAlgorithm: process.env['AUTH_ENCRYPTION_ALGORITHM'] || 'bcrypt',
  encryptionKey: process.env['AUTH_ENCRYPTION_KEY'] || 'default_encryption_key',
}));

export type AuthConfig = ConfigType<typeof authConfig>;

export const InjectAuthConfig = () => Inject(authConfig.KEY);
