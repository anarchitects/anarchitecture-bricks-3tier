import { InjectionToken, inject } from '@angular/core';

export type AuthConfig = {
  apiResourcePath: string;
};

export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AUTH_CONFIG');
export const API_RESOURCE_PATH = new InjectionToken<string>(
  'AUTH_API_RESOURCE_PATH'
);

/** Library-level sensible defaults */
export const AUTH_DEFAULTS: AuthConfig = {
  apiResourcePath: 'auth',
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
