import { Provider, inject } from '@angular/core';
import {
  ANX_LAYOUT_DEFAULTS,
  ANX_LAYOUT_DEFINITIONS,
  injectAnxLayoutDefaults,
  toAnxLayoutDefaultMap,
} from './layout-registry.tokens';
import { AnxLayoutDefinition } from '@anarchitects/common-angular-ui-layouts/contracts';
import { AnxLayoutDefaults } from './layout-registry.types';

export function provideAnxLayouts(
  definitions: readonly AnxLayoutDefinition[],
): Provider[] {
  return definitions.map((definition) => ({
    provide: ANX_LAYOUT_DEFINITIONS,
    useValue: definition,
    multi: true,
  }));
}

export function provideAnxLayoutDefaults(
  defaults: AnxLayoutDefaults,
): Provider {
  return {
    provide: ANX_LAYOUT_DEFAULTS,
    useFactory: () => {
      const inheritedDefaults = inject(ANX_LAYOUT_DEFAULTS, {
        optional: true,
        skipSelf: true,
      });

      return {
        ...(inheritedDefaults ?? {}),
        ...toAnxLayoutDefaultMap(defaults),
      };
    },
  };
}

export function provideAnxLayoutRegistryConfig(
  options: {
    definitions?: readonly AnxLayoutDefinition[];
    defaults?: AnxLayoutDefaults;
  } = {},
): Provider[] {
  const providers: Provider[] = [];

  if (options.definitions?.length) {
    providers.push(...provideAnxLayouts(options.definitions));
  }

  if (options.defaults) {
    providers.push(provideAnxLayoutDefaults(options.defaults));
  }

  return providers;
}

export function resolveAnxLayoutDefault(kind: string): string | undefined {
  const defaults = injectAnxLayoutDefaults();
  return defaults[kind];
}
