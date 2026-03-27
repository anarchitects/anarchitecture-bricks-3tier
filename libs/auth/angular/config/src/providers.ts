import { Provider } from '@angular/core';
import {
  API_RESOURCE_PATH,
  AUTH_CONFIG,
  AUTH_DEFAULTS,
  AuthConfig,
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
