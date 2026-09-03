import {
  FormsLayoutId,
  FormsPageActionAlignment,
  FormsPageLayoutVariant,
  FormsPagePreset,
  FormsPageSpacing,
  normalizeFormsPagePreset,
} from '@anarchitects/forms-angular/config';

type LayoutOptions = Readonly<Record<string, unknown>>;

export type ResolvedFormsPageLayout = {
  id: FormsLayoutId;
  variant: FormsPageLayoutVariant;
  spacing: FormsPageSpacing;
  columns: number;
  actionAlignment: FormsPageActionAlignment;
  actionJustify: string;
  maxInlineSize: string | null;
};

const layoutVariants = new Set<FormsPageLayoutVariant>([
  'stacked',
  'grid',
  'inline',
  'card',
]);

function resolveVariant(
  layout: FormsLayoutId | null,
  fallback: FormsPageLayoutVariant,
): FormsPageLayoutVariant {
  const candidate = layout?.split(':', 2)[1];
  return candidate && layoutVariants.has(candidate as FormsPageLayoutVariant)
    ? (candidate as FormsPageLayoutVariant)
    : fallback;
}

function resolveActionJustify(alignment: FormsPageActionAlignment): string {
  return {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
  }[alignment];
}

export function resolveFormsPageLayout(
  explicitLayout: FormsLayoutId | null,
  explicitLayoutOptions: LayoutOptions,
  pagePreset: FormsPagePreset,
): ResolvedFormsPageLayout {
  const normalizedPreset = normalizeFormsPagePreset(pagePreset);
  const variant = resolveVariant(
    explicitLayout,
    normalizedPreset.layoutVariant,
  );
  const actionAlignment =
    (explicitLayoutOptions['actionAlignment'] as
      | FormsPageActionAlignment
      | undefined) ?? normalizedPreset.actionAlignment;
  const columns =
    Number(explicitLayoutOptions['columns']) || normalizedPreset.columns || 1;

  return {
    id: explicitLayout ?? `form:${variant}`,
    variant,
    spacing: normalizedPreset.spacing,
    columns,
    actionAlignment,
    actionJustify: resolveActionJustify(actionAlignment),
    maxInlineSize: normalizedPreset.maxInlineSize,
  };
}
