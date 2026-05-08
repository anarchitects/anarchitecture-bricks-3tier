import { Provider } from '@angular/core';
import {
  IDENTITY_API_BASE_URL,
  IDENTITY_API_RESOURCE_PATH,
  IDENTITY_CONFIG,
  IDENTITY_DEFAULTS,
  IdentityConfig,
} from './tokens';

export function provideIdentityConfig(
  config: Partial<IdentityConfig> = {},
): Provider[] {
  const merged: IdentityConfig = { ...IDENTITY_DEFAULTS, ...config };

  return [
    { provide: IDENTITY_CONFIG, useValue: merged },
    { provide: IDENTITY_API_BASE_URL, useValue: merged.apiBaseUrl },
    { provide: IDENTITY_API_RESOURCE_PATH, useValue: merged.apiResourcePath },
  ];
}

export function provideIdentityDefaults(): Provider[] {
  return provideIdentityConfig({});
}
