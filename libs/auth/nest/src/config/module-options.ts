import {
  DEFAULT_AUTH_ENCRYPTION_ALGORITHM,
  DEFAULT_AUTH_ENCRYPTION_KEY,
  DEFAULT_AUTH_MAILER_PROVIDER,
  DEFAULT_AUTH_PERSISTENCE,
  DEFAULT_AUTH_STRATEGIES,
} from './auth.config';
import type { CommonMailerProvider } from '@anarchitects/common-nest-mailer';
import type { AuthConfig } from './auth.config';
import type { ResourceAuthorizationOptions } from '../application/resource-authorization.types';

export type AuthEngine = 'legacy-jwt' | 'better-auth';
export type AuthSessionMode = 'jwt' | 'session';

export type AuthSpikeSocialProviderConfig = {
  clientId?: string;
  clientSecret?: string;
};

export type AuthSpikeOptions = {
  baseUrl?: string;
  secret?: string;
  proofHarnessEnabled?: boolean;
  socialProviders?: {
    github?: AuthSpikeSocialProviderConfig;
  };
  passkeys?: {
    rpID?: string;
    rpName?: string;
    origin?: string;
  };
};

export type ResolvedAuthSpikeOptions = {
  baseUrl: string;
  secret: string;
  proofHarnessEnabled: boolean;
  socialProviders: {
    github?: AuthSpikeSocialProviderConfig;
  };
  passkeys: {
    rpID: string;
    rpName: string;
    origin?: string;
  };
};

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
  engine?: AuthEngine;
  sessionMode?: AuthSessionMode;
  features?: {
    passkeys?: boolean;
    social?: boolean;
    oidc?: boolean;
  };
  spike?: AuthSpikeOptions;
  encryption?: {
    algorithm?: 'bcrypt' | 'argon2';
    key?: string;
  };
  persistence?: AuthPersistenceModuleOptions;
  resourceAuthorization?: ResourceAuthorizationOptions;
};

export type ResolvedAuthApplicationModuleOptions = {
  authStrategies: string[];
  engine: AuthEngine;
  sessionMode: AuthSessionMode;
  features: {
    passkeys: boolean;
    social: boolean;
    oidc: boolean;
  };
  spike: ResolvedAuthSpikeOptions;
  encryption: {
    algorithm: 'bcrypt' | 'argon2';
    key: string;
  };
  persistence: ResolvedAuthPersistenceModuleOptions;
  resourceAuthorization: Required<ResourceAuthorizationOptions>;
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
  engine: options.engine ?? 'legacy-jwt',
  sessionMode: options.sessionMode ?? 'jwt',
  features: {
    passkeys: options.features?.passkeys ?? false,
    social: options.features?.social ?? false,
    oidc: options.features?.oidc ?? false,
  },
  spike: {
    baseUrl: options.spike?.baseUrl ?? 'http://localhost:3000/api/auth',
    secret:
      options.spike?.secret ?? 'better-auth-spike-secret-32-chars-minimum',
    proofHarnessEnabled: options.spike?.proofHarnessEnabled ?? false,
    socialProviders: {
      github: options.spike?.socialProviders?.github
        ? {
            clientId: options.spike.socialProviders.github.clientId,
            clientSecret: options.spike.socialProviders.github.clientSecret,
          }
        : undefined,
    },
    passkeys: {
      rpID: options.spike?.passkeys?.rpID ?? 'localhost',
      rpName: options.spike?.passkeys?.rpName ?? 'Anarchitecture Auth Spike',
      origin: options.spike?.passkeys?.origin,
    },
  },
  encryption: {
    algorithm:
      options.encryption?.algorithm ??
      (DEFAULT_AUTH_ENCRYPTION_ALGORITHM as 'bcrypt' | 'argon2'),
    key: options.encryption?.key ?? DEFAULT_AUTH_ENCRYPTION_KEY,
  },
  persistence: resolveAuthPersistenceModuleOptions(options.persistence),
  resourceAuthorization: {
    loaders: { ...(options.resourceAuthorization?.loaders ?? {}) },
  },
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
  engine: config.engine ?? 'legacy-jwt',
  sessionMode: config.sessionMode ?? 'jwt',
  features: {
    passkeys: config.features?.passkeys ?? false,
    social: config.features?.social ?? false,
    oidc: config.features?.oidc ?? false,
  },
  spike: {
    baseUrl: config.spike?.baseUrl ?? 'http://localhost:3000/api/auth',
    secret: config.spike?.secret ?? 'better-auth-spike-secret-32-chars-minimum',
    proofHarnessEnabled: config.spike?.proofHarnessEnabled ?? false,
    socialProviders: {
      github: config.spike?.socialProviders?.github
        ? {
            clientId: config.spike.socialProviders.github.clientId,
            clientSecret: config.spike.socialProviders.github.clientSecret,
          }
        : undefined,
    },
    passkeys: {
      rpID: config.spike?.passkeys?.rpID ?? 'localhost',
      rpName: config.spike?.passkeys?.rpName ?? 'Anarchitecture Auth Spike',
      origin: config.spike?.passkeys?.origin,
    },
  },
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
