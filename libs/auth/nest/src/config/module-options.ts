import {
  DEFAULT_AUTH_ENCRYPTION_ALGORITHM,
  DEFAULT_AUTH_ENCRYPTION_KEY,
  DEFAULT_AUTH_MAILER_PROVIDER,
  DEFAULT_AUTH_PERSISTENCE,
  DEFAULT_AUTH_STRATEGIES,
} from './auth.config';
import type { CommonMailerProvider } from '@anarchitects/common-nest-mailer';
import type { AuthConfig } from './auth.config';

export type AuthPersistenceModuleOptions = {
  persistence?: string;
};

export type ResolvedAuthPersistenceModuleOptions = {
  persistence: string;
};

export type AuthMailerModuleOptions = {
  provider?: CommonMailerProvider;
};

export type ResolvedAuthMailerModuleOptions = {
  provider: CommonMailerProvider;
};

export type AuthApplicationModuleOptions = {
  authStrategies?: string[];
  encryption?: {
    algorithm?: 'bcrypt' | 'argon2';
    key?: string;
  };
  persistence?: AuthPersistenceModuleOptions;
};

export type ResolvedAuthApplicationModuleOptions = {
  authStrategies: string[];
  encryption: {
    algorithm: 'bcrypt' | 'argon2';
    key: string;
  };
  persistence: ResolvedAuthPersistenceModuleOptions;
};

export type AuthPresentationModuleOptions = {
  application?: AuthApplicationModuleOptions;
};

export type ResolvedAuthPresentationModuleOptions = {
  application: ResolvedAuthApplicationModuleOptions;
};

export type AuthModuleFeatures = {
  provider?: CommonMailerProvider;
};

export type AuthModuleOptions = {
  presentation?: AuthPresentationModuleOptions;
  mailer?: AuthMailerModuleOptions;
};

export type ResolvedAuthModuleOptions = {
  presentation: ResolvedAuthPresentationModuleOptions;
  mailer: ResolvedAuthMailerModuleOptions;
};

export const resolveAuthPersistenceModuleOptions = (
  options: AuthPersistenceModuleOptions = {},
): ResolvedAuthPersistenceModuleOptions => ({
  persistence: options.persistence ?? DEFAULT_AUTH_PERSISTENCE,
});

export const resolveAuthMailerModuleOptions = (
  options: AuthMailerModuleOptions = {},
): ResolvedAuthMailerModuleOptions => ({
  provider: options.provider ?? DEFAULT_AUTH_MAILER_PROVIDER,
});

export const resolveAuthApplicationModuleOptions = (
  options: AuthApplicationModuleOptions = {},
): ResolvedAuthApplicationModuleOptions => ({
  authStrategies: options.authStrategies ?? [...DEFAULT_AUTH_STRATEGIES],
  encryption: {
    algorithm:
      options.encryption?.algorithm ??
      (DEFAULT_AUTH_ENCRYPTION_ALGORITHM as 'bcrypt' | 'argon2'),
    key: options.encryption?.key ?? DEFAULT_AUTH_ENCRYPTION_KEY,
  },
  persistence: resolveAuthPersistenceModuleOptions(options.persistence),
});

export const resolveAuthPresentationModuleOptions = (
  options: AuthPresentationModuleOptions = {},
): ResolvedAuthPresentationModuleOptions => ({
  application: resolveAuthApplicationModuleOptions(options.application),
});

export const resolveAuthModuleOptions = (
  options: AuthModuleOptions = {},
): ResolvedAuthModuleOptions => ({
  presentation: resolveAuthPresentationModuleOptions(options.presentation),
  mailer: resolveAuthMailerModuleOptions(options.mailer),
});

export const mapAuthConfigToPersistenceModuleOptions = (
  config: AuthConfig,
): AuthPersistenceModuleOptions => ({
  persistence: config.persistence ?? DEFAULT_AUTH_PERSISTENCE,
});

export const mapAuthConfigToMailerModuleOptions = (
  config: AuthConfig,
): AuthMailerModuleOptions => ({
  provider: config.mailerProvider ?? DEFAULT_AUTH_MAILER_PROVIDER,
});

export const mapAuthConfigToApplicationModuleOptions = (
  config: AuthConfig,
): AuthApplicationModuleOptions => ({
  authStrategies: config.authStrategies ?? [...DEFAULT_AUTH_STRATEGIES],
  encryption: {
    algorithm: config.encryptionAlgorithm as 'bcrypt' | 'argon2',
    key: config.encryptionKey ?? DEFAULT_AUTH_ENCRYPTION_KEY,
  },
  persistence: mapAuthConfigToPersistenceModuleOptions(config),
});

export const mapAuthConfigToPresentationModuleOptions = (
  config: AuthConfig,
): AuthPresentationModuleOptions => ({
  application: mapAuthConfigToApplicationModuleOptions(config),
});

export const mapAuthConfigToAuthModuleOptions = (
  config: AuthConfig,
): AuthModuleOptions => ({
  presentation: mapAuthConfigToPresentationModuleOptions(config),
  mailer: mapAuthConfigToMailerModuleOptions(config),
});
