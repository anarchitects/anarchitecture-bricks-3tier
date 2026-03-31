import { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';
import {
  FormsPagePreset,
  normalizeFormsPagePreset,
} from '@anarchitects/forms-angular/config';

type LayoutOptions = Readonly<Record<string, unknown>>;

export type ResolvedFormsPageLayout = {
  layout: AnxLayoutId | null;
  layoutOptions: LayoutOptions;
  maxInlineSize: string | null;
};

export function resolveFormsPageLayout(
  explicitLayout: AnxLayoutId | null,
  explicitLayoutOptions: LayoutOptions,
  pagePreset: FormsPagePreset | null,
): ResolvedFormsPageLayout {
  if (!pagePreset) {
    return {
      layout: explicitLayout,
      layoutOptions: explicitLayoutOptions,
      maxInlineSize: null,
    };
  }

  const normalizedPreset = normalizeFormsPagePreset(pagePreset);

  return {
    layout:
      explicitLayout ??
      (`form:${normalizedPreset.layoutVariant}` satisfies AnxLayoutId),
    layoutOptions: {
      spacing: normalizedPreset.spacing,
      actionAlignment: normalizedPreset.actionAlignment,
      ...(normalizedPreset.columns
        ? { columns: normalizedPreset.columns }
        : {}),
      ...explicitLayoutOptions,
    },
    maxInlineSize: normalizedPreset.maxInlineSize,
  };
}
