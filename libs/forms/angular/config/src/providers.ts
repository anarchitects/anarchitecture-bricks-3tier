import { Provider } from '@angular/core';
import {
  FORMS_PAGE_PRESET,
  FormsPagePresetInput,
  normalizeFormsPagePreset,
} from './page-preset';
import {
  API_BASE_URL,
  API_RESOURCE_PATH,
  FORMS_CONFIG,
  FORMS_DEFAULTS,
  FormsConfig,
} from './tokens';

/** Explicit config from the app (merges with library defaults) */
export function provideFormsConfig(cfg: Partial<FormsConfig>): Provider[] {
  const merged: FormsConfig = { ...FORMS_DEFAULTS, ...cfg };
  return [
    { provide: FORMS_CONFIG, useValue: merged },
    { provide: API_BASE_URL, useValue: merged.apiBaseUrl },
    { provide: API_RESOURCE_PATH, useValue: merged.apiResourcePath },
  ];
}

/** Zero-config convenience: register only defaults */
export function provideFormsDefaults(): Provider[] {
  return provideFormsConfig({});
}

/** Provide a normalized forms page preset for form layout rendering. */
export function provideFormsPagePreset(
  preset: FormsPagePresetInput,
): Provider[] {
  return [
    {
      provide: FORMS_PAGE_PRESET,
      useValue: normalizeFormsPagePreset(preset),
    },
  ];
}
