import {
  DEFAULT_AUTH_ENCRYPTION_ALGORITHM,
  DEFAULT_AUTH_ENCRYPTION_KEY,
  DEFAULT_AUTH_ENGINE_ISOLATED_TOPOLOGY,
  DEFAULT_AUTH_ENGINE_PERSISTENCE_MODE,
  DEFAULT_AUTH_ENGINE_SEPARATE_DB_PORT,
  DEFAULT_AUTH_ENGINE_SEPARATE_DB_SSL,
  DEFAULT_AUTH_MAILER_PROVIDER,
  DEFAULT_AUTH_PERSISTENCE,
  DEFAULT_AUTH_STRATEGIES,
} from './auth.config';
import type { CommonMailerProvider } from '@anarchitects/common-nest-mailer';
import type { AuthConfig } from './auth.config';
import type { ResourceAuthorizationOptions } from '../application/resource-authorization.types';

export type AuthEngine = 'legacy-jwt' | 'better-auth';
export type AuthSessionMode = 'jwt' | 'session';
export type AuthEnginePersistenceMode = 'isolated' | 'typeorm-adapter';
export type AuthEngineIsolatedTopology = 'same-db' | 'separate-db';

export type AuthEngineSeparateDatabaseOptions = {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
};

export type ResolvedAuthEngineSeparateDatabaseOptions = {
  host?: string;
  port: number;
  username?: string;
  password?: string;
  database?: string;
  ssl: boolean;
};

export type AuthEnginePersistenceOptions = {
  mode?: AuthEnginePersistenceMode;
  isolatedTopology?: AuthEngineIsolatedTopology;
  separateDatabase?: AuthEngineSeparateDatabaseOptions;
};

export type ResolvedAuthEnginePersistenceOptions = {
  mode: AuthEnginePersistenceMode;
  isolatedTopology: AuthEngineIsolatedTopology;
  separateDatabase: ResolvedAuthEngineSeparateDatabaseOptions;
};

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
  engineOptions?: {
    persistence?: AuthEnginePersistenceOptions;
  };
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
  engineOptions: {
    persistence: ResolvedAuthEnginePersistenceOptions;
  };
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

export const resolveAuthEnginePersistenceOptions = (
  options: AuthEnginePersistenceOptions = {},
): ResolvedAuthEnginePersistenceOptions => {
  const resolved = {
    mode: options.mode ?? DEFAULT_AUTH_ENGINE_PERSISTENCE_MODE,
    isolatedTopology:
      options.isolatedTopology ?? DEFAULT_AUTH_ENGINE_ISOLATED_TOPOLOGY,
    separateDatabase: {
      host: options.separateDatabase?.host,
      port:
        options.separateDatabase?.port ?? DEFAULT_AUTH_ENGINE_SEPARATE_DB_PORT,
      username: options.separateDatabase?.username,
      password: options.separateDatabase?.password,
      database: options.separateDatabase?.database,
      ssl: options.separateDatabase?.ssl ?? DEFAULT_AUTH_ENGINE_SEPARATE_DB_SSL,
    },
  } satisfies ResolvedAuthEnginePersistenceOptions;

  if (
    resolved.mode === 'isolated' &&
    resolved.isolatedTopology === 'separate-db'
  ) {
    const missingFields = [
      ['host', resolved.separateDatabase.host],
      ['username', resolved.separateDatabase.username],
      ['password', resolved.separateDatabase.password],
      ['database', resolved.separateDatabase.database],
    ]
      .filter(([, value]) => !value)
      .map(([field]) => field);

    if (missingFields.length > 0) {
      throw new Error(
        `Auth engine separate database configuration is incomplete: missing ${missingFields.join(', ')}`,
      );
    }
  }

  return resolved;
};

export const resolveAuthApplicationModuleOptions = (
  options: AuthApplicationModuleOptions = {},
): ResolvedAuthApplicationModuleOptions => ({
  authStrategies: options.authStrategies ?? [...DEFAULT_AUTH_STRATEGIES],
  engine: options.engine ?? 'legacy-jwt',
  sessionMode: options.sessionMode ?? 'jwt',
  engineOptions: {
    persistence: resolveAuthEnginePersistenceOptions(
      options.engineOptions?.persistence,
    ),
  },
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
  engineOptions: {
    persistence: {
      mode:
        config.engineOptions?.persistence?.mode ??
        DEFAULT_AUTH_ENGINE_PERSISTENCE_MODE,
      isolatedTopology:
        config.engineOptions?.persistence?.isolatedTopology ??
        DEFAULT_AUTH_ENGINE_ISOLATED_TOPOLOGY,
      separateDatabase: {
        host: config.engineOptions?.persistence?.separateDatabase?.host,
        port:
          config.engineOptions?.persistence?.separateDatabase?.port ??
          DEFAULT_AUTH_ENGINE_SEPARATE_DB_PORT,
        username: config.engineOptions?.persistence?.separateDatabase?.username,
        password: config.engineOptions?.persistence?.separateDatabase?.password,
        database: config.engineOptions?.persistence?.separateDatabase?.database,
        ssl:
          config.engineOptions?.persistence?.separateDatabase?.ssl ??
          DEFAULT_AUTH_ENGINE_SEPARATE_DB_SSL,
      },
    },
  },
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
