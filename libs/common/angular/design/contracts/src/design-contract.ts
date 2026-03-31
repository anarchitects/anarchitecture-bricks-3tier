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

/**
 * Shell-only layout utility classes.
 *
 * These classes define consumer/app shell spacing and flow and MUST NOT be
 * applied to package component host elements. Applying these to component hosts
 * creates unintended spacing collisions when the component is nested inside
 * a consumer's own layout containers using the same utilities.
 *
 * Package authors: use `:host { padding: ...; gap: ...; }` CSS instead.
 * See {@link ANX_PACKAGE_AUTHOR_RULES} for guidance.
 */
export const ANX_SHELL_UTILITY_CLASSNAMES = {
  region: 'anx-region',
  stack: 'anx-stack',
  inline: 'anx-inline',
  grid: 'anx-grid',
} as const;

export type AnxShellUtilityClassName =
  (typeof ANX_SHELL_UTILITY_CLASSNAMES)[keyof typeof ANX_SHELL_UTILITY_CLASSNAMES];

/**
 * Design hook classes safe for component styling.
 *
 * These classes define visual treatment and typography that are safe to
 * compose into package component styling without causing layout collisions.
 *
 * Example: `anx-card` uses `anx-surface` for visual treatment.
 */
export const ANX_DESIGN_HOOK_CLASSNAMES = {
  surface: 'anx-surface',
  heading: 'anx-heading',
  text: 'anx-text',
  action: 'anx-action',
} as const;

export type AnxDesignHookClassName =
  (typeof ANX_DESIGN_HOOK_CLASSNAMES)[keyof typeof ANX_DESIGN_HOOK_CLASSNAMES];

/**
 * Union of all semantic classes (shell utilities + design hooks).
 *
 * Kept for backward compatibility. For new code, prefer the categorized
 * {@link ANX_SHELL_UTILITY_CLASSNAMES} and {@link ANX_DESIGN_HOOK_CLASSNAMES}.
 */
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

/**
 * Type guard for shell utility class names.
 */
export function isAnxShellUtilityClass(
  value: string,
): value is AnxShellUtilityClassName {
  return Object.values(ANX_SHELL_UTILITY_CLASSNAMES).includes(
    value as AnxShellUtilityClassName,
  );
}

export function isAnxDensity(value: string): value is AnxDensity {
  return (ANX_DENSITIES as readonly string[]).includes(value);
}

export function isAnxSurface(value: string): value is AnxSurface {
  return (ANX_SURFACES as readonly string[]).includes(value);
}

export function isAnxLayout(value: string): value is AnxLayout {
  return (ANX_LAYOUTS as readonly string[]).includes(value);
}
