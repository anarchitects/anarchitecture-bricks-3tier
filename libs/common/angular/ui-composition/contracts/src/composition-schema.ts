import { InjectionToken, Provider, inject } from '@angular/core';
import { AnxSlotName } from './slot-contract';
import {
  AnxTemplateDefaultLayoutRegion,
  AnxTemplateName,
} from './template-contract';

export type AnxCompositionSchema = {
  componentKind: string;
  supportedSlots: readonly AnxSlotName[];
  supportedTemplates: readonly AnxTemplateName[];
  defaultLayoutRegion?: AnxTemplateDefaultLayoutRegion;
};

export const ANX_COMPOSITION_SCHEMA = new InjectionToken<
  readonly AnxCompositionSchema[]
>('ANX_COMPOSITION_SCHEMA');

export function provideAnxCompositionSchema(
  schema: AnxCompositionSchema,
): Provider {
  return {
    provide: ANX_COMPOSITION_SCHEMA,
    useValue: schema,
    multi: true,
  };
}

export function injectAnxCompositionSchemas(): readonly AnxCompositionSchema[] {
  return inject(ANX_COMPOSITION_SCHEMA, { optional: true }) ?? [];
}
