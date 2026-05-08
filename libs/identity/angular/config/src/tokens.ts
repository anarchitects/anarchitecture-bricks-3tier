import { InjectionToken } from '@angular/core';

export type IdentityConfig = {
  apiBaseUrl?: string;
  apiResourcePath: string;
};

export const IDENTITY_DEFAULTS: IdentityConfig = {
  apiResourcePath: 'identity',
};

export const IDENTITY_CONFIG = new InjectionToken<IdentityConfig>(
  'IDENTITY_CONFIG',
);

export const IDENTITY_API_BASE_URL = new InjectionToken<string | undefined>(
  'IDENTITY_API_BASE_URL',
);

export const IDENTITY_API_RESOURCE_PATH = new InjectionToken<string>(
  'IDENTITY_API_RESOURCE_PATH',
);
