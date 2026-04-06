import type { CommonMailerProvider } from '@anarchitects/common-nest-mailer';
import type {
  AuthContractConfig,
  AuthFieldConfig,
} from '@anarchitects/auth-ts';
import { DefaultAuthContractConfig } from '@anarchitects/auth-ts';
import type { ResourceAuthorizationOptions } from './resource-authorization.types';
import type { AuthConfig } from './auth.config';
import {
  DEFAULT_AUTH_BETTER_AUTH_BASE_URL,
  DEFAULT_AUTH_BETTER_AUTH_RESET_PASSWORD_CALLBACK_URL,
  DEFAULT_AUTH_BETTER_AUTH_SECRET,
  DEFAULT_AUTH_BETTER_AUTH_VERIFY_EMAIL_CALLBACK_URL,
  DEFAULT_AUTH_ENCRYPTION_ALGORITHM,
  DEFAULT_AUTH_ENCRYPTION_KEY,
  DEFAULT_AUTH_MAILER_PROVIDER,
  DEFAULT_AUTH_PLUGIN_JWT_AUDIENCE,
  DEFAULT_AUTH_PLUGIN_JWT_ENABLED,
  DEFAULT_AUTH_PLUGIN_JWT_EXPIRATION,
  DEFAULT_AUTH_PLUGIN_JWT_ISSUER,
  DEFAULT_AUTH_PLUGIN_JWT_SECRET,
  DEFAULT_AUTH_PLUGIN_OIDC_ENABLED,
  DEFAULT_AUTH_PLUGIN_PASSKEY_RP_ID,
  DEFAULT_AUTH_PLUGIN_PASSKEY_RP_NAME,
  DEFAULT_AUTH_PLUGIN_PASSKEYS_ENABLED,
  DEFAULT_AUTH_PLUGIN_SOCIAL_ENABLED,
} from './auth.config';

export type AuthBetterAuthOptions = {
  baseUrl?: string;
  secret?: string;
  callbackUrls?: {
    verifyEmail?: string;
    resetPassword?: string;
  };
};

export type ResolvedAuthBetterAuthOptions = {
  baseUrl: string;
  secret: string;
  callbackUrls: {
    verifyEmail: string;
    resetPassword: string;
  };
};

export type AuthJwtPluginOptions = {
  enabled?: boolean;
  secret?: string;
  expiration?: string;
  audience?: string;
  issuer?: string;
};

export type ResolvedAuthJwtPluginOptions = {
  enabled: boolean;
  secret: string;
  expiration: string;
  audience: string;
  issuer: string;
};

export type AuthPasskeysPluginOptions = {
  enabled?: boolean;
  rpID?: string;
  rpName?: string;
  origin?: string;
};

export type ResolvedAuthPasskeysPluginOptions = {
  enabled: boolean;
  rpID: string;
  rpName: string;
  origin?: string;
};

export type AuthSocialProviderConfig = {
  clientId?: string;
  clientSecret?: string;
};

export type AuthSocialPluginOptions = {
  enabled?: boolean;
  github?: AuthSocialProviderConfig;
};

export type ResolvedAuthSocialPluginOptions = {
  enabled: boolean;
  github?: AuthSocialProviderConfig;
};

export type AuthOidcPluginOptions = {
  enabled?: boolean;
};

export type ResolvedAuthOidcPluginOptions = {
  enabled: boolean;
};

export type AuthPluginsOptions = {
  jwt?: AuthJwtPluginOptions;
  passkeys?: AuthPasskeysPluginOptions;
  social?: AuthSocialPluginOptions;
  oidc?: AuthOidcPluginOptions;
};

export type ResolvedAuthPluginsOptions = {
  jwt: ResolvedAuthJwtPluginOptions;
  passkeys: ResolvedAuthPasskeysPluginOptions;
  social: ResolvedAuthSocialPluginOptions;
  oidc: ResolvedAuthOidcPluginOptions;
};

export type AuthPersistenceModuleOptions = Record<string, never>;
export type ResolvedAuthPersistenceModuleOptions = Record<string, never>;

type DeepPartial<T> = T extends object
  ? {
      [K in keyof T]?: DeepPartial<T[K]>;
    }
  : T;

export type AuthContractConfigOverrides = DeepPartial<AuthContractConfig>;

export type AuthMailerModuleOptions = {
  provider?: CommonMailerProvider;
};

export type ResolvedAuthMailerModuleOptions = {
  provider: CommonMailerProvider;
};

export type AuthApplicationModuleOptions = {
  betterAuth?: AuthBetterAuthOptions;
  plugins?: AuthPluginsOptions;
  encryption?: {
    algorithm?: 'bcrypt' | 'argon2';
    key?: string;
  };
  resourceAuthorization?: ResourceAuthorizationOptions;
};

export type ResolvedAuthApplicationModuleOptions = {
  betterAuth: ResolvedAuthBetterAuthOptions;
  plugins: ResolvedAuthPluginsOptions;
  encryption: {
    algorithm: 'bcrypt' | 'argon2';
    key: string;
  };
  resourceAuthorization: Required<ResourceAuthorizationOptions>;
};

export type AuthPresentationModuleOptions = {
  application?: AuthApplicationModuleOptions;
  contracts?: AuthContractConfigOverrides;
};

export type ResolvedAuthPresentationModuleOptions = {
  application: ResolvedAuthApplicationModuleOptions;
  contracts: AuthContractConfig;
};

export type AuthModulePresentationOptions = Omit<
  AuthPresentationModuleOptions,
  'contracts'
>;

export type AuthModuleFeatures = {
  provider?: CommonMailerProvider;
};

export type AuthModuleOptions = {
  presentation?: AuthModulePresentationOptions;
  contracts?: AuthContractConfigOverrides;
  mailer?: AuthMailerModuleOptions;
};

export type ResolvedAuthModuleOptions = {
  presentation: ResolvedAuthPresentationModuleOptions;
  mailer: ResolvedAuthMailerModuleOptions;
};

export const resolveAuthPersistenceModuleOptions = (
  options: AuthPersistenceModuleOptions = {},
): ResolvedAuthPersistenceModuleOptions => {
  void options;
  return {};
};

export const resolveAuthMailerModuleOptions = (
  options: AuthMailerModuleOptions = {},
): ResolvedAuthMailerModuleOptions => ({
  provider: options.provider ?? DEFAULT_AUTH_MAILER_PROVIDER,
});

export const resolveAuthApplicationModuleOptions = (
  options: AuthApplicationModuleOptions = {},
): ResolvedAuthApplicationModuleOptions => ({
  betterAuth: {
    baseUrl: options.betterAuth?.baseUrl ?? DEFAULT_AUTH_BETTER_AUTH_BASE_URL,
    secret: options.betterAuth?.secret ?? DEFAULT_AUTH_BETTER_AUTH_SECRET,
    callbackUrls: {
      verifyEmail:
        options.betterAuth?.callbackUrls?.verifyEmail ??
        DEFAULT_AUTH_BETTER_AUTH_VERIFY_EMAIL_CALLBACK_URL,
      resetPassword:
        options.betterAuth?.callbackUrls?.resetPassword ??
        DEFAULT_AUTH_BETTER_AUTH_RESET_PASSWORD_CALLBACK_URL,
    },
  },
  plugins: {
    jwt: {
      enabled: options.plugins?.jwt?.enabled ?? DEFAULT_AUTH_PLUGIN_JWT_ENABLED,
      secret: options.plugins?.jwt?.secret ?? DEFAULT_AUTH_PLUGIN_JWT_SECRET,
      expiration:
        options.plugins?.jwt?.expiration ?? DEFAULT_AUTH_PLUGIN_JWT_EXPIRATION,
      audience:
        options.plugins?.jwt?.audience ?? DEFAULT_AUTH_PLUGIN_JWT_AUDIENCE,
      issuer: options.plugins?.jwt?.issuer ?? DEFAULT_AUTH_PLUGIN_JWT_ISSUER,
    },
    passkeys: {
      enabled:
        options.plugins?.passkeys?.enabled ??
        DEFAULT_AUTH_PLUGIN_PASSKEYS_ENABLED,
      rpID:
        options.plugins?.passkeys?.rpID ?? DEFAULT_AUTH_PLUGIN_PASSKEY_RP_ID,
      rpName:
        options.plugins?.passkeys?.rpName ??
        DEFAULT_AUTH_PLUGIN_PASSKEY_RP_NAME,
      origin: options.plugins?.passkeys?.origin,
    },
    social: {
      ...resolveAuthSocialPluginOptions(options.plugins?.social),
    },
    oidc: {
      enabled:
        options.plugins?.oidc?.enabled ?? DEFAULT_AUTH_PLUGIN_OIDC_ENABLED,
    },
  },
  encryption: {
    algorithm:
      options.encryption?.algorithm ??
      (DEFAULT_AUTH_ENCRYPTION_ALGORITHM as 'bcrypt' | 'argon2'),
    key: options.encryption?.key ?? DEFAULT_AUTH_ENCRYPTION_KEY,
  },
  resourceAuthorization: {
    loaders: { ...(options.resourceAuthorization?.loaders ?? {}) },
  },
});

const hasOwn = <K extends PropertyKey>(
  value: object | undefined,
  key: K,
): value is Record<K, unknown> =>
  value !== undefined && Object.prototype.hasOwnProperty.call(value, key);

const resolveAuthFieldConfig = (
  defaults: AuthFieldConfig,
  overrides?: DeepPartial<AuthFieldConfig>,
): AuthFieldConfig => ({
  required: overrides?.required ?? defaults.required,
  minLength: hasOwn(overrides, 'minLength')
    ? (overrides.minLength as AuthFieldConfig['minLength'])
    : defaults.minLength,
  maxLength: hasOwn(overrides, 'maxLength')
    ? (overrides.maxLength as AuthFieldConfig['maxLength'])
    : defaults.maxLength,
  emptyStringPolicy: overrides?.emptyStringPolicy ?? defaults.emptyStringPolicy,
});

export const resolveAuthContractConfig = (
  overrides: AuthContractConfigOverrides = {},
): AuthContractConfig => ({
  version: overrides.version ?? DefaultAuthContractConfig.version,
  register: {
    email: resolveAuthFieldConfig(
      DefaultAuthContractConfig.register.email,
      overrides.register?.email,
    ),
    password: resolveAuthFieldConfig(
      DefaultAuthContractConfig.register.password,
      overrides.register?.password,
    ),
    confirmPassword: resolveAuthFieldConfig(
      DefaultAuthContractConfig.register.confirmPassword,
      overrides.register?.confirmPassword,
    ),
    name: resolveAuthFieldConfig(
      DefaultAuthContractConfig.register.name,
      overrides.register?.name,
    ),
  },
  login: {
    credential: resolveAuthFieldConfig(
      DefaultAuthContractConfig.login.credential,
      overrides.login?.credential,
    ),
    password: resolveAuthFieldConfig(
      DefaultAuthContractConfig.login.password,
      overrides.login?.password,
    ),
  },
  forgotPassword: {
    email: resolveAuthFieldConfig(
      DefaultAuthContractConfig.forgotPassword.email,
      overrides.forgotPassword?.email,
    ),
  },
  resetPassword: {
    token: resolveAuthFieldConfig(
      DefaultAuthContractConfig.resetPassword.token,
      overrides.resetPassword?.token,
    ),
    password: resolveAuthFieldConfig(
      DefaultAuthContractConfig.resetPassword.password,
      overrides.resetPassword?.password,
    ),
    confirmPassword: resolveAuthFieldConfig(
      DefaultAuthContractConfig.resetPassword.confirmPassword,
      overrides.resetPassword?.confirmPassword,
    ),
  },
  verifyEmail: {
    token: resolveAuthFieldConfig(
      DefaultAuthContractConfig.verifyEmail.token,
      overrides.verifyEmail?.token,
    ),
  },
  changePassword: {
    currentPassword: resolveAuthFieldConfig(
      DefaultAuthContractConfig.changePassword.currentPassword,
      overrides.changePassword?.currentPassword,
    ),
    newPassword: resolveAuthFieldConfig(
      DefaultAuthContractConfig.changePassword.newPassword,
      overrides.changePassword?.newPassword,
    ),
    confirmPassword: resolveAuthFieldConfig(
      DefaultAuthContractConfig.changePassword.confirmPassword,
      overrides.changePassword?.confirmPassword,
    ),
  },
  logout: {},
});

export const resolveAuthPresentationModuleOptions = (
  options: AuthPresentationModuleOptions = {},
): ResolvedAuthPresentationModuleOptions => ({
  application: resolveAuthApplicationModuleOptions(options.application),
  contracts: resolveAuthContractConfig(options.contracts),
});

export const resolveAuthModuleOptions = (
  options: AuthModuleOptions = {},
): ResolvedAuthModuleOptions => ({
  presentation: resolveAuthPresentationModuleOptions({
    ...options.presentation,
    contracts: options.contracts,
  }),
  mailer: resolveAuthMailerModuleOptions(options.mailer),
});

export const mapAuthConfigToPersistenceModuleOptions = (
  config: AuthConfig,
): AuthPersistenceModuleOptions => {
  void config;
  return {};
};

export const mapAuthConfigToMailerModuleOptions = (
  config: AuthConfig,
): AuthMailerModuleOptions => ({
  provider: config.mailerProvider ?? DEFAULT_AUTH_MAILER_PROVIDER,
});

export const mapAuthConfigToApplicationModuleOptions = (
  config: AuthConfig,
): AuthApplicationModuleOptions => ({
  betterAuth: {
    baseUrl: config.betterAuth?.baseUrl ?? DEFAULT_AUTH_BETTER_AUTH_BASE_URL,
    secret: config.betterAuth?.secret ?? DEFAULT_AUTH_BETTER_AUTH_SECRET,
    callbackUrls: {
      verifyEmail:
        config.betterAuth?.callbackUrls?.verifyEmail ??
        DEFAULT_AUTH_BETTER_AUTH_VERIFY_EMAIL_CALLBACK_URL,
      resetPassword:
        config.betterAuth?.callbackUrls?.resetPassword ??
        DEFAULT_AUTH_BETTER_AUTH_RESET_PASSWORD_CALLBACK_URL,
    },
  },
  plugins: {
    jwt: {
      enabled: config.plugins?.jwt?.enabled ?? DEFAULT_AUTH_PLUGIN_JWT_ENABLED,
      secret: config.plugins?.jwt?.secret ?? DEFAULT_AUTH_PLUGIN_JWT_SECRET,
      expiration:
        config.plugins?.jwt?.expiration ?? DEFAULT_AUTH_PLUGIN_JWT_EXPIRATION,
      audience:
        config.plugins?.jwt?.audience ?? DEFAULT_AUTH_PLUGIN_JWT_AUDIENCE,
      issuer: config.plugins?.jwt?.issuer ?? DEFAULT_AUTH_PLUGIN_JWT_ISSUER,
    },
    passkeys: {
      enabled:
        config.plugins?.passkeys?.enabled ??
        DEFAULT_AUTH_PLUGIN_PASSKEYS_ENABLED,
      rpID: config.plugins?.passkeys?.rpID ?? DEFAULT_AUTH_PLUGIN_PASSKEY_RP_ID,
      rpName:
        config.plugins?.passkeys?.rpName ?? DEFAULT_AUTH_PLUGIN_PASSKEY_RP_NAME,
      origin: config.plugins?.passkeys?.origin,
    },
    social: {
      ...resolveAuthSocialPluginOptions(config.plugins?.social),
    },
    oidc: {
      enabled:
        config.plugins?.oidc?.enabled ?? DEFAULT_AUTH_PLUGIN_OIDC_ENABLED,
    },
  },
  encryption: {
    algorithm: config.encryptionAlgorithm as 'bcrypt' | 'argon2',
    key: config.encryptionKey ?? DEFAULT_AUTH_ENCRYPTION_KEY,
  },
});

const resolveAuthSocialPluginOptions = (
  socialOptions?: AuthSocialPluginOptions | AuthConfig['plugins']['social'],
): ResolvedAuthSocialPluginOptions => {
  const enabled = socialOptions?.enabled ?? DEFAULT_AUTH_PLUGIN_SOCIAL_ENABLED;
  const github = socialOptions?.github
    ? {
        clientId: socialOptions.github.clientId,
        clientSecret: socialOptions.github.clientSecret,
      }
    : undefined;

  if (enabled && (!github?.clientId || !github.clientSecret)) {
    throw new Error(
      'Social auth requires AUTH_PLUGIN_SOCIAL_GITHUB_CLIENT_ID and AUTH_PLUGIN_SOCIAL_GITHUB_CLIENT_SECRET when enabled.',
    );
  }

  return {
    enabled,
    github,
  };
};

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
