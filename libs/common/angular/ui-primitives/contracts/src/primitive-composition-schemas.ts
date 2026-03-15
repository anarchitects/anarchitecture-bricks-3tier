import { AnxCompositionSchema } from '@anarchitects/common-angular-ui-composition/contracts';

export const BUTTON_COMPOSITION_SCHEMA: AnxCompositionSchema = {
  componentKind: 'button',
  supportedSlots: ['start', 'content', 'end'],
  supportedTemplates: [],
  defaultLayoutRegion: 'content',
};

export const FIELD_COMPOSITION_SCHEMA: AnxCompositionSchema = {
  componentKind: 'field',
  supportedSlots: ['label', 'start', 'content', 'end', 'hint', 'error'],
  supportedTemplates: [],
  defaultLayoutRegion: 'content',
};

export const CARD_COMPOSITION_SCHEMA: AnxCompositionSchema = {
  componentKind: 'card',
  supportedSlots: ['header', 'content', 'footer'],
  supportedTemplates: [],
  defaultLayoutRegion: 'content',
};

export const ALERT_COMPOSITION_SCHEMA: AnxCompositionSchema = {
  componentKind: 'alert',
  supportedSlots: ['start', 'content', 'actions'],
  supportedTemplates: [],
  defaultLayoutRegion: 'content',
};

export const BADGE_COMPOSITION_SCHEMA: AnxCompositionSchema = {
  componentKind: 'badge',
  supportedSlots: ['start', 'content', 'end'],
  supportedTemplates: [],
  defaultLayoutRegion: 'content',
};

export const SPINNER_COMPOSITION_SCHEMA: AnxCompositionSchema = {
  componentKind: 'spinner',
  supportedSlots: ['content'],
  supportedTemplates: [],
  defaultLayoutRegion: 'content',
};

export const PRIMITIVE_COMPOSITION_SCHEMAS: readonly AnxCompositionSchema[] = [
  BUTTON_COMPOSITION_SCHEMA,
  FIELD_COMPOSITION_SCHEMA,
  CARD_COMPOSITION_SCHEMA,
  ALERT_COMPOSITION_SCHEMA,
  BADGE_COMPOSITION_SCHEMA,
  SPINNER_COMPOSITION_SCHEMA,
];
