import { Provider } from '@angular/core';
import type {
  AuthContractConfig,
  AuthFieldConfig,
} from '@anarchitects/auth-ts';
import {
  DefaultAuthContractConfig,
  createAuthContracts,
} from '@anarchitects/auth-ts';
import {
  API_RESOURCE_PATH,
  AUTH_CONTRACTS,
  AUTH_CONFIG,
  AUTH_DEFAULTS,
  AuthConfig,
  AuthFieldConfigOverrides,
  AuthContractConfigOverrides,
} from './tokens';

export function provideAuthConfig(cfg: Partial<AuthConfig>): Provider[] {
  const merged: AuthConfig = {
    ...AUTH_DEFAULTS,
    ...cfg,
    plugins: {
      ...AUTH_DEFAULTS.plugins,
      ...cfg.plugins,
      jwt: {
        ...AUTH_DEFAULTS.plugins.jwt,
        ...cfg.plugins?.jwt,
      },
    },
  };
  return [
    { provide: AUTH_CONFIG, useValue: merged },
    { provide: API_RESOURCE_PATH, useValue: merged.apiResourcePath },
  ];
}

export function provideAuthDefaults(): Provider[] {
  return provideAuthConfig({});
}

const hasOwn = <K extends PropertyKey>(
  value: object | undefined,
  key: K,
): value is Record<K, unknown> =>
  value !== undefined && Object.prototype.hasOwnProperty.call(value, key);

const resolveAuthFieldConfig = (
  defaults: AuthFieldConfig,
  overrides?: AuthFieldConfigOverrides,
): AuthFieldConfig => {
  const fieldOverrides = overrides;

  return {
    required: fieldOverrides?.required ?? defaults.required,
    minLength: hasOwn(fieldOverrides, 'minLength')
      ? fieldOverrides.minLength
      : defaults.minLength,
    maxLength: hasOwn(fieldOverrides, 'maxLength')
      ? fieldOverrides.maxLength
      : defaults.maxLength,
    emptyStringPolicy:
      fieldOverrides?.emptyStringPolicy ?? defaults.emptyStringPolicy,
  };
};

const resolveAuthContractConfig = (
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

export function provideAuthContracts(
  overrides: AuthContractConfigOverrides = {},
): Provider[] {
  const resolvedConfig = resolveAuthContractConfig(overrides);

  return [
    {
      provide: AUTH_CONTRACTS,
      useValue: createAuthContracts(resolvedConfig),
    },
  ];
}
