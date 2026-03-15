import { AnxTemplateName } from '@anarchitects/common-angular-ui-composition/contracts';
import {
  AnxTemplateDirective,
  findAnxTemplate,
} from '@anarchitects/common-angular-ui-composition/templates';
import {
  AnxResolvedLayoutContext,
  parseAnxLayoutId,
} from '@anarchitects/common-angular-ui-layouts/contracts';
import { TemplateRef } from '@angular/core';

export function flattenContextTemplates(
  context: AnxResolvedLayoutContext,
): readonly AnxTemplateDirective[] {
  return Array.from(context.templates.values()).flat();
}

export function resolveTemplate(
  context: AnxResolvedLayoutContext,
  name: AnxTemplateName,
  variant?: string | null,
): TemplateRef<unknown> | null {
  return findAnxTemplate(flattenContextTemplates(context), name, variant);
}

export function resolveLayoutVariant(id: string): string {
  const parsed = parseAnxLayoutId(id);
  return parsed?.name ?? 'default';
}
