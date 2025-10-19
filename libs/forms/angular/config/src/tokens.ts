import { InjectionToken, inject } from '@angular/core';

export type FormsConfig = {
  /** Prefix or resource path used by data-access. */
  apiResourcePath: string;
};

export const FORMS_CONFIG = new InjectionToken<FormsConfig>('FORMS_CONFIG');
export const API_RESOURCE_PATH = new InjectionToken<string>(
  'FORMS_API_RESOURCE_PATH'
);

/** Library-level sensible defaults */
export const FORMS_DEFAULTS: FormsConfig = {
  apiResourcePath: 'forms',
};

/** Safe injectors that fall back to defaults if no providers are registered */
export function injectFormsConfig(): FormsConfig {
  return inject(FORMS_CONFIG, { optional: true }) ?? FORMS_DEFAULTS;
}

export function injectApiResourcePath(): string {
  return (
    inject(API_RESOURCE_PATH, { optional: true }) ??
    FORMS_DEFAULTS.apiResourcePath
  );
}
