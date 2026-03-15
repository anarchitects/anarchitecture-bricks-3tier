import { InjectionToken, inject } from '@angular/core';
import {
  AnxDensity,
  AnxLayout,
  AnxSurface,
} from '@anarchitects/common-angular-design/contracts';

export type DesignSystemConfig = {
  theme: string;
  density: AnxDensity;
  surface: AnxSurface;
  layout: AnxLayout;
  columns: number;
};

export const DESIGN_SYSTEM_DEFAULTS: DesignSystemConfig = {
  theme: 'default',
  density: 'comfortable',
  surface: 'plain',
  layout: 'list',
  columns: 1,
};

export const DESIGN_SYSTEM_CONFIG = new InjectionToken<DesignSystemConfig>(
  'DESIGN_SYSTEM_CONFIG',
);

export const DESIGN_SYSTEM_THEME = new InjectionToken<string>(
  'DESIGN_SYSTEM_THEME',
);
export const DESIGN_SYSTEM_DENSITY = new InjectionToken<AnxDensity>(
  'DESIGN_SYSTEM_DENSITY',
);
export const DESIGN_SYSTEM_SURFACE = new InjectionToken<AnxSurface>(
  'DESIGN_SYSTEM_SURFACE',
);
export const DESIGN_SYSTEM_LAYOUT = new InjectionToken<AnxLayout>(
  'DESIGN_SYSTEM_LAYOUT',
);
export const DESIGN_SYSTEM_COLUMNS = new InjectionToken<number>(
  'DESIGN_SYSTEM_COLUMNS',
);

export function injectDesignSystemConfig(): DesignSystemConfig {
  return (
    inject(DESIGN_SYSTEM_CONFIG, { optional: true }) ?? DESIGN_SYSTEM_DEFAULTS
  );
}
