export const ANX_TOKEN_PREFIX = '--anx-';
export const ANX_COMPONENT_TOKEN_PREFIX = '--anx-cmp-';

export const ANX_TOKEN_NAMES = {
  ref: {
    colorNeutral0: '--anx-ref-color-neutral-0',
    colorNeutral50: '--anx-ref-color-neutral-50',
    colorNeutral100: '--anx-ref-color-neutral-100',
    colorNeutral700: '--anx-ref-color-neutral-700',
    colorNeutral900: '--anx-ref-color-neutral-900',
    colorBrand500: '--anx-ref-color-brand-500',
    colorBrand700: '--anx-ref-color-brand-700',
    colorSuccess500: '--anx-ref-color-success-500',
    colorSuccess50: '--anx-ref-color-success-50',
    colorDanger500: '--anx-ref-color-danger-500',
    colorDanger50: '--anx-ref-color-danger-50',
    shadowSoft: '--anx-ref-shadow-soft',
  },
  sys: {
    colorSurface: '--anx-sys-color-surface',
    colorSurfaceMuted: '--anx-sys-color-surface-muted',
    colorText: '--anx-sys-color-text',
    colorTextMuted: '--anx-sys-color-text-muted',
    colorBorder: '--anx-sys-color-border',
    colorAccent: '--anx-sys-color-accent',
    colorAccentContrast: '--anx-sys-color-accent-contrast',
    colorSuccess: '--anx-sys-color-success',
    colorSuccessContrast: '--anx-sys-color-success-contrast',
    colorSuccessSurface: '--anx-sys-color-success-surface',
    colorDanger: '--anx-sys-color-danger',
    colorDangerContrast: '--anx-sys-color-danger-contrast',
    colorDangerSurface: '--anx-sys-color-danger-surface',
    colorDisabledSurface: '--anx-sys-color-disabled-surface',
    colorDisabledFg: '--anx-sys-color-disabled-fg',
    colorDisabledBorder: '--anx-sys-color-disabled-border',
    radiusSm: '--anx-sys-radius-sm',
    radiusMd: '--anx-sys-radius-md',
    radiusLg: '--anx-sys-radius-lg',
    spaceXs: '--anx-sys-space-xs',
    spaceSm: '--anx-sys-space-sm',
    spaceMd: '--anx-sys-space-md',
    spaceLg: '--anx-sys-space-lg',
    fontFamilyBase: '--anx-sys-font-family-base',
    fontSizeBody: '--anx-sys-font-size-body',
    fontSizeHeading: '--anx-sys-font-size-heading',
    lineHeightBody: '--anx-sys-line-height-body',
    focusRing: '--anx-sys-focus-ring',
    shadowSurface: '--anx-sys-shadow-surface',
  },
  layout: {
    containerMaxInlineSize: '--anx-layout-container-max-inline-size',
    gapInline: '--anx-layout-gap-inline',
    gapStack: '--anx-layout-gap-stack',
    gridMinColumnSize: '--anx-layout-grid-min-column-size',
    columns: '--anx-layout-columns',
    blockPaddingCompact: '--anx-layout-block-padding-compact',
    blockPaddingComfortable: '--anx-layout-block-padding-comfortable',
  },
} as const;

export type AnxRefTokenName =
  (typeof ANX_TOKEN_NAMES.ref)[keyof typeof ANX_TOKEN_NAMES.ref];
export type AnxSysTokenName =
  (typeof ANX_TOKEN_NAMES.sys)[keyof typeof ANX_TOKEN_NAMES.sys];
export type AnxLayoutTokenName =
  (typeof ANX_TOKEN_NAMES.layout)[keyof typeof ANX_TOKEN_NAMES.layout];

export type AnxTokenName =
  | AnxRefTokenName
  | AnxSysTokenName
  | AnxLayoutTokenName;

export const ANX_DEFAULT_REF_TOKEN_VALUES: Readonly<
  Record<AnxRefTokenName, string>
> = {
  [ANX_TOKEN_NAMES.ref.colorNeutral0]: '#ffffff',
  [ANX_TOKEN_NAMES.ref.colorNeutral50]: '#f6f7f8',
  [ANX_TOKEN_NAMES.ref.colorNeutral100]: '#eceff2',
  [ANX_TOKEN_NAMES.ref.colorNeutral700]: '#30353d',
  [ANX_TOKEN_NAMES.ref.colorNeutral900]: '#161a20',
  [ANX_TOKEN_NAMES.ref.colorBrand500]: '#0f6fc6',
  [ANX_TOKEN_NAMES.ref.colorBrand700]: '#08569c',
  [ANX_TOKEN_NAMES.ref.colorSuccess500]: '#1f8f56',
  [ANX_TOKEN_NAMES.ref.colorSuccess50]: '#ebf8f1',
  [ANX_TOKEN_NAMES.ref.colorDanger500]: '#c23b3b',
  [ANX_TOKEN_NAMES.ref.colorDanger50]: '#fceeee',
  [ANX_TOKEN_NAMES.ref.shadowSoft]: '0 10px 30px rgba(22, 26, 32, 0.08)',
};

export const ANX_DEFAULT_SYS_TOKEN_VALUES: Readonly<
  Record<AnxSysTokenName, string>
> = {
  [ANX_TOKEN_NAMES.sys.colorSurface]: 'var(--anx-ref-color-neutral-0)',
  [ANX_TOKEN_NAMES.sys.colorSurfaceMuted]: 'var(--anx-ref-color-neutral-50)',
  [ANX_TOKEN_NAMES.sys.colorText]: 'var(--anx-ref-color-neutral-900)',
  [ANX_TOKEN_NAMES.sys.colorTextMuted]: 'var(--anx-ref-color-neutral-700)',
  [ANX_TOKEN_NAMES.sys.colorBorder]: 'var(--anx-ref-color-neutral-100)',
  [ANX_TOKEN_NAMES.sys.colorAccent]: 'var(--anx-ref-color-brand-500)',
  [ANX_TOKEN_NAMES.sys.colorAccentContrast]: 'var(--anx-ref-color-neutral-0)',
  [ANX_TOKEN_NAMES.sys.colorSuccess]: 'var(--anx-ref-color-success-500)',
  [ANX_TOKEN_NAMES.sys.colorSuccessContrast]: 'var(--anx-ref-color-neutral-0)',
  [ANX_TOKEN_NAMES.sys.colorSuccessSurface]: 'var(--anx-ref-color-success-50)',
  [ANX_TOKEN_NAMES.sys.colorDanger]: 'var(--anx-ref-color-danger-500)',
  [ANX_TOKEN_NAMES.sys.colorDangerContrast]: 'var(--anx-ref-color-neutral-0)',
  [ANX_TOKEN_NAMES.sys.colorDangerSurface]: 'var(--anx-ref-color-danger-50)',
  [ANX_TOKEN_NAMES.sys.colorDisabledSurface]:
    'var(--anx-ref-color-neutral-100)',
  [ANX_TOKEN_NAMES.sys.colorDisabledFg]: 'var(--anx-ref-color-neutral-700)',
  [ANX_TOKEN_NAMES.sys.colorDisabledBorder]: 'var(--anx-ref-color-neutral-100)',
  [ANX_TOKEN_NAMES.sys.radiusSm]: '0.25rem',
  [ANX_TOKEN_NAMES.sys.radiusMd]: '0.5rem',
  [ANX_TOKEN_NAMES.sys.radiusLg]: '0.75rem',
  [ANX_TOKEN_NAMES.sys.spaceXs]: '0.25rem',
  [ANX_TOKEN_NAMES.sys.spaceSm]: '0.5rem',
  [ANX_TOKEN_NAMES.sys.spaceMd]: '0.75rem',
  [ANX_TOKEN_NAMES.sys.spaceLg]: '1rem',
  [ANX_TOKEN_NAMES.sys.fontFamilyBase]:
    '"Source Sans 3", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  [ANX_TOKEN_NAMES.sys.fontSizeBody]: '0.9375rem',
  [ANX_TOKEN_NAMES.sys.fontSizeHeading]: '1.25rem',
  [ANX_TOKEN_NAMES.sys.lineHeightBody]: '1.45',
  [ANX_TOKEN_NAMES.sys.focusRing]: '2px solid var(--anx-sys-color-accent)',
  [ANX_TOKEN_NAMES.sys.shadowSurface]: 'var(--anx-ref-shadow-soft)',
};

export const ANX_DEFAULT_LAYOUT_TOKEN_VALUES: Readonly<
  Record<AnxLayoutTokenName, string>
> = {
  [ANX_TOKEN_NAMES.layout.containerMaxInlineSize]: '75rem',
  [ANX_TOKEN_NAMES.layout.gapInline]: '0.75rem',
  [ANX_TOKEN_NAMES.layout.gapStack]: '1rem',
  [ANX_TOKEN_NAMES.layout.gridMinColumnSize]: '16rem',
  [ANX_TOKEN_NAMES.layout.columns]: '1',
  [ANX_TOKEN_NAMES.layout.blockPaddingCompact]: '0.5rem',
  [ANX_TOKEN_NAMES.layout.blockPaddingComfortable]: '0.875rem',
};

export const ANX_DEFAULT_TOKEN_VALUES: Readonly<Record<AnxTokenName, string>> =
  {
    ...ANX_DEFAULT_REF_TOKEN_VALUES,
    ...ANX_DEFAULT_SYS_TOKEN_VALUES,
    ...ANX_DEFAULT_LAYOUT_TOKEN_VALUES,
  };
