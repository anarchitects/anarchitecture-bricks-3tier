import {
  AnxTemplateName,
  normalizeAnxTemplateName,
} from '@anarchitects/common-angular-ui-composition/contracts';
import { TemplateRef } from '@angular/core';
import { AnxTemplateDirective } from './template.directive';

export function findAnxTemplate<Context = unknown>(
  templates: readonly AnxTemplateDirective<Context>[],
  name: AnxTemplateName | string,
  variant?: string | null,
): TemplateRef<Context> | null {
  const normalizedName = normalizeAnxTemplateName(name);
  if (!normalizedName) {
    return null;
  }

  const exactVariantMatch = templates.find((template) => {
    return (
      template.normalizedTemplateName() === normalizedName &&
      template.anxTemplateVariant() === (variant ?? null)
    );
  });
  if (exactVariantMatch) {
    return exactVariantMatch.templateRef;
  }

  const fallback = templates.find((template) => {
    return (
      template.normalizedTemplateName() === normalizedName &&
      template.anxTemplateVariant() == null
    );
  });

  return fallback?.templateRef ?? null;
}

export function groupAnxTemplatesByName<Context = unknown>(
  templates: readonly AnxTemplateDirective<Context>[],
): ReadonlyMap<AnxTemplateName, readonly AnxTemplateDirective<Context>[]> {
  const groups = new Map<AnxTemplateName, AnxTemplateDirective<Context>[]>();

  for (const template of templates) {
    const name = template.normalizedTemplateName();
    if (!name) {
      continue;
    }

    const existingGroup = groups.get(name) ?? [];
    existingGroup.push(template);
    groups.set(name, existingGroup);
  }

  return groups;
}
