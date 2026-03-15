import { InjectionToken, inject } from '@angular/core';
import { AnxLayoutDefinition } from '@anarchitects/common-angular-ui-layouts/contracts';
import {
  AnxLayoutDefaultMap,
  AnxLayoutDefaults,
} from './layout-registry.types';

export const ANX_LAYOUT_DEFINITIONS = new InjectionToken<
  readonly AnxLayoutDefinition[]
>('ANX_LAYOUT_DEFINITIONS', {
  factory: () => [],
});

export const ANX_LAYOUT_DEFAULTS = new InjectionToken<AnxLayoutDefaultMap>(
  'ANX_LAYOUT_DEFAULTS',
  {
    factory: () => ({}),
  },
);

export function injectAnxLayoutDefaults(): AnxLayoutDefaultMap {
  return inject(ANX_LAYOUT_DEFAULTS, { optional: true }) ?? {};
}

export function toAnxLayoutDefaultMap(
  defaults: AnxLayoutDefaults,
): AnxLayoutDefaultMap {
  return defaults;
}
