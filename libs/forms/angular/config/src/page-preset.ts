import { InjectionToken, inject } from '@angular/core';

export type FormsPageLayoutVariant = 'stacked' | 'grid' | 'inline' | 'card';
export type FormsPageSpacing = 'compact' | 'comfortable' | 'relaxed';
export type FormsPageActionAlignment = 'start' | 'center' | 'end' | 'between';
export type FormsLayoutId = `${string}:${string}`;

export type FormsPagePreset = {
  layoutVariant: FormsPageLayoutVariant;
  maxInlineSize: string;
  spacing: FormsPageSpacing;
  actionAlignment: FormsPageActionAlignment;
  columns?: number;
  pageTitle?: string;
  pageSubtitle?: string;
  pageCaption?: string;
};

export type FormsPagePresetInput = Partial<FormsPagePreset>;

export const FORMS_PAGE_PRESET = new InjectionToken<FormsPagePreset>(
  'FORMS_PAGE_PRESET',
);

export const FORMS_PAGE_PRESET_DEFAULTS: FormsPagePreset = {
  layoutVariant: 'stacked',
  maxInlineSize: '42rem',
  spacing: 'comfortable',
  actionAlignment: 'end',
};

function normalizeOptionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeFormsPagePreset(
  preset: FormsPagePresetInput | null | undefined,
): FormsPagePreset {
  const merged: FormsPagePreset = {
    ...FORMS_PAGE_PRESET_DEFAULTS,
    ...(preset ?? {}),
    pageTitle: normalizeOptionalText((preset ?? {}).pageTitle),
    pageSubtitle: normalizeOptionalText((preset ?? {}).pageSubtitle),
    pageCaption: normalizeOptionalText((preset ?? {}).pageCaption),
  };

  if (merged.columns === undefined || merged.columns === null) {
    return merged;
  }

  const columns = Math.floor(Number(merged.columns));
  return {
    ...merged,
    columns: Number.isFinite(columns) && columns > 0 ? columns : 1,
  };
}

export function injectFormsPagePreset(): FormsPagePreset {
  return (
    inject(FORMS_PAGE_PRESET, { optional: true }) ?? FORMS_PAGE_PRESET_DEFAULTS
  );
}
