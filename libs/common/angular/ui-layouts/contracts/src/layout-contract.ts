import { Type } from '@angular/core';
import {
  AnxSlotName,
  AnxTemplateName,
} from '@anarchitects/common-angular-ui-composition/contracts';
import type { AnxSlotDirective } from '@anarchitects/common-angular-ui-composition/projection';
import type { AnxTemplateDirective } from '@anarchitects/common-angular-ui-composition/templates';

const APP_LAYOUT_PREFIX = 'app-';

export const ANX_BUILT_IN_LAYOUT_KINDS = ['form', 'list', 'detail'] as const;
export type AnxBuiltInLayoutKind = (typeof ANX_BUILT_IN_LAYOUT_KINDS)[number];
export type AnxLayoutKind = AnxBuiltInLayoutKind | `app-${string}`;

export type AnxLayoutId = `${AnxLayoutKind}:${string}`;

export type AnxLayoutDefinition = {
  id: AnxLayoutId;
  kind: AnxLayoutKind;
  renderer: Type<unknown>;
  supportedTemplates: readonly AnxTemplateName[];
  supportedSlots: readonly AnxSlotName[];
  description?: string;
};

export type AnxResolvedLayoutContext = {
  layout: AnxLayoutDefinition;
  model: unknown;
  templates: ReadonlyMap<AnxTemplateName, readonly AnxTemplateDirective[]>;
  slots: ReadonlyMap<AnxSlotName, readonly AnxSlotDirective[]>;
  options: Readonly<Record<string, unknown>>;
};

export const ANX_REQUIRED_TEMPLATES_BY_KIND: Readonly<
  Record<AnxBuiltInLayoutKind, readonly AnxTemplateName[]>
> = {
  form: ['field'],
  list: ['item'],
  detail: ['content'],
};

export function isAnxLayoutKind(value: string): value is AnxLayoutKind {
  return (
    (ANX_BUILT_IN_LAYOUT_KINDS as readonly string[]).includes(value) ||
    value.startsWith(APP_LAYOUT_PREFIX)
  );
}

export function parseAnxLayoutId(
  value: string,
): { kind: AnxLayoutKind; name: string } | null {
  const [kindValue, ...nameParts] = value.split(':');
  if (!kindValue || nameParts.length === 0) {
    return null;
  }

  if (!isAnxLayoutKind(kindValue)) {
    return null;
  }

  const name = nameParts.join(':').trim();
  if (!name) {
    return null;
  }

  return {
    kind: kindValue,
    name,
  };
}

export function isAnxLayoutId(value: string): value is AnxLayoutId {
  return parseAnxLayoutId(value) !== null;
}

export function createAnxLayoutId(
  kind: AnxLayoutKind,
  name: string,
): AnxLayoutId {
  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error('Layout name must be a non-empty string.');
  }

  return `${kind}:${normalizedName}`;
}

export function getRequiredTemplatesForKind(
  kind: AnxLayoutKind,
): readonly AnxTemplateName[] {
  if (kind === 'form' || kind === 'list' || kind === 'detail') {
    return ANX_REQUIRED_TEMPLATES_BY_KIND[kind];
  }

  return [];
}
