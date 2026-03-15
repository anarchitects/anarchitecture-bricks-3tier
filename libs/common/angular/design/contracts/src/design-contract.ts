export const ANX_DATA_ATTRIBUTES = {
  theme: 'data-anx-theme',
  density: 'data-anx-density',
  surface: 'data-anx-surface',
  layout: 'data-anx-layout',
  columns: 'data-anx-columns',
} as const;

export const ANX_DENSITIES = ['compact', 'comfortable'] as const;
export type AnxDensity = (typeof ANX_DENSITIES)[number];

export const ANX_SURFACES = ['plain', 'card'] as const;
export type AnxSurface = (typeof ANX_SURFACES)[number];

export const ANX_LAYOUTS = ['list', 'grid'] as const;
export type AnxLayout = (typeof ANX_LAYOUTS)[number];

export type AnxTheme = string;

export type AnxColumns = number;

export type DesignSystemContext = {
  theme: AnxTheme;
  density: AnxDensity;
  surface: AnxSurface;
  layout: AnxLayout;
  columns: AnxColumns;
};

export const ANX_ROOT_CLASS = 'anx-root';

export const ANX_SEMANTIC_CLASSNAMES = {
  region: 'anx-region',
  surface: 'anx-surface',
  stack: 'anx-stack',
  inline: 'anx-inline',
  grid: 'anx-grid',
  heading: 'anx-heading',
  text: 'anx-text',
  action: 'anx-action',
} as const;

export function isAnxDensity(value: string): value is AnxDensity {
  return (ANX_DENSITIES as readonly string[]).includes(value);
}

export function isAnxSurface(value: string): value is AnxSurface {
  return (ANX_SURFACES as readonly string[]).includes(value);
}

export function isAnxLayout(value: string): value is AnxLayout {
  return (ANX_LAYOUTS as readonly string[]).includes(value);
}
