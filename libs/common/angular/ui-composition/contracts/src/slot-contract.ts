const APP_EXTENSION_PREFIX = 'app-';

export const KNOWN_ANX_SLOT_NAMES = [
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
  'sidebar',
] as const;

export type KnownAnxSlotName = (typeof KNOWN_ANX_SLOT_NAMES)[number];
export type AnxSlotName = KnownAnxSlotName | `app-${string}`;

export const ANX_SLOT_ALIASES: Readonly<Record<string, KnownAnxSlotName>> = {
  anxCardHeader: 'header',
  anxCardFooter: 'footer',
  anxStart: 'start',
  anxEnd: 'end',
  anxActions: 'actions',
  anxLabel: 'label',
  anxHint: 'hint',
  anxError: 'error',
};

export function isKnownAnxSlotName(value: string): value is KnownAnxSlotName {
  return (KNOWN_ANX_SLOT_NAMES as readonly string[]).includes(value);
}

export function isAnxSlotName(value: string): value is AnxSlotName {
  return isKnownAnxSlotName(value) || value.startsWith(APP_EXTENSION_PREFIX);
}

export function normalizeAnxSlotName(value: string): AnxSlotName | null {
  const alias = ANX_SLOT_ALIASES[value];
  if (alias) {
    return alias;
  }

  if (isAnxSlotName(value)) {
    return value;
  }

  return null;
}
