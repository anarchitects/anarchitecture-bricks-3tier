import { Provider } from '@angular/core';
import {
  DESIGN_SYSTEM_COLUMNS,
  DESIGN_SYSTEM_CONFIG,
  DESIGN_SYSTEM_DEFAULTS,
  DESIGN_SYSTEM_DENSITY,
  DESIGN_SYSTEM_LAYOUT,
  DESIGN_SYSTEM_SURFACE,
  DESIGN_SYSTEM_THEME,
  DesignSystemConfig,
} from './config.tokens';
import { provideDocumentDesignSystemDomSync } from './document-dom-sync.providers';

export function provideDesignSystemConfig(
  overrides: Partial<DesignSystemConfig>,
): Provider[] {
  const merged: DesignSystemConfig = {
    ...DESIGN_SYSTEM_DEFAULTS,
    ...overrides,
  };

  return [
    { provide: DESIGN_SYSTEM_CONFIG, useValue: merged },
    { provide: DESIGN_SYSTEM_THEME, useValue: merged.theme },
    { provide: DESIGN_SYSTEM_DENSITY, useValue: merged.density },
    { provide: DESIGN_SYSTEM_SURFACE, useValue: merged.surface },
    { provide: DESIGN_SYSTEM_LAYOUT, useValue: merged.layout },
    { provide: DESIGN_SYSTEM_COLUMNS, useValue: merged.columns },
    ...provideDocumentDesignSystemDomSync(),
  ];
}

export function provideDesignSystemDefaults(): Provider[] {
  return provideDesignSystemConfig({});
}
