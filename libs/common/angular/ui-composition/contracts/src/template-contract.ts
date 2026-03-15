const APP_EXTENSION_PREFIX = 'app-';

export const KNOWN_ANX_TEMPLATE_NAMES = [
  'header',
  'toolbar',
  'content',
  'footer',
  'actions',
  'start',
  'end',
  'label',
  'hint',
  'error',
  'prefix',
  'suffix',
  'empty',
  'item',
  'field',
  'cell',
] as const;

export type KnownAnxTemplateName = (typeof KNOWN_ANX_TEMPLATE_NAMES)[number];
export type AnxTemplateName = KnownAnxTemplateName | `app-${string}`;
export type AnxTemplateDefaultLayoutRegion = 'content' | 'item' | 'field';

export function isKnownAnxTemplateName(
  value: string,
): value is KnownAnxTemplateName {
  return (KNOWN_ANX_TEMPLATE_NAMES as readonly string[]).includes(value);
}

export function isAnxTemplateName(value: string): value is AnxTemplateName {
  return (
    isKnownAnxTemplateName(value) || value.startsWith(APP_EXTENSION_PREFIX)
  );
}

export function normalizeAnxTemplateName(
  value: string,
): AnxTemplateName | null {
  if (!isAnxTemplateName(value)) {
    return null;
  }

  return value;
}
