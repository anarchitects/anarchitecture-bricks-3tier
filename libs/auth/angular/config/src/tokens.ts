import { HttpContextToken } from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';
import {
  type AuthContractConfig,
  type AuthContracts,
  type AuthFieldConfig,
  type ChangePasswordFieldConfig,
  DefaultAuthContractConfig,
  type ForgotPasswordFieldConfig,
  type LoginFieldConfig,
  type RegisterFieldConfig,
  type ResetPasswordFieldConfig,
  type VerifyEmailFieldConfig,
  createAuthContracts,
} from '@anarchitects/auth-ts';

export type AuthConfig = {
  apiResourcePath: string;
  plugins: {
    jwt: {
      enabled: boolean;
    };
  };
};

export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AUTH_CONFIG');
export const API_RESOURCE_PATH = new InjectionToken<string>(
  'AUTH_API_RESOURCE_PATH',
);
export const SUPPRESS_AUTH_FAILURE_REDIRECT = new HttpContextToken<boolean>(
  () => false,
);

export type AuthFieldConfigOverrides = Partial<AuthFieldConfig>;

export type AuthContractConfigOverrides = {
  version?: AuthContractConfig['version'];
  register?: Partial<{
    [K in keyof RegisterFieldConfig]: AuthFieldConfigOverrides;
  }>;
  login?: Partial<{
    [K in keyof LoginFieldConfig]: AuthFieldConfigOverrides;
  }>;
  forgotPassword?: Partial<{
    [K in keyof ForgotPasswordFieldConfig]: AuthFieldConfigOverrides;
  }>;
  resetPassword?: Partial<{
    [K in keyof ResetPasswordFieldConfig]: AuthFieldConfigOverrides;
  }>;
  verifyEmail?: Partial<{
    [K in keyof VerifyEmailFieldConfig]: AuthFieldConfigOverrides;
  }>;
  changePassword?: Partial<{
    [K in keyof ChangePasswordFieldConfig]: AuthFieldConfigOverrides;
  }>;
};
export type ResolvedAuthContracts = AuthContracts<AuthContractConfig>;

export const AUTH_CONTRACTS = new InjectionToken<ResolvedAuthContracts>(
  'AUTH_CONTRACTS',
  {
    factory: () =>
      createAuthContracts(DefaultAuthContractConfig) as ResolvedAuthContracts,
  },
);

/** Library-level sensible defaults */
export const AUTH_DEFAULTS: AuthConfig = {
  apiResourcePath: 'auth',
  plugins: {
    jwt: {
      enabled: false,
    },
  },
};

/** Safe injectors that fall back to defaults if no providers are registered */
export function injectAuthConfig(): AuthConfig {
  return inject(AUTH_CONFIG, { optional: true }) ?? AUTH_DEFAULTS;
}

export function injectApiResourcePath(): string {
  return (
    inject(API_RESOURCE_PATH, { optional: true }) ??
    AUTH_DEFAULTS.apiResourcePath
  );
}

export function injectAuthContracts(): ResolvedAuthContracts {
  return inject(AUTH_CONTRACTS);
}
