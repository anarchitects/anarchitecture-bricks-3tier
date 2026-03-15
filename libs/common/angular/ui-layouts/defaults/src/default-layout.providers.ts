import { Provider } from '@angular/core';
import {
  provideAnxLayoutDefaults,
  provideAnxLayouts,
} from '@anarchitects/common-angular-ui-layouts/registry';
import {
  ANX_DEFAULT_LAYOUT_DEFAULTS,
  ANX_DEFAULT_LAYOUT_DEFINITIONS,
} from './layout-definitions';

export function provideAnxDefaultLayouts(): Provider[] {
  return [
    ...provideAnxLayouts(ANX_DEFAULT_LAYOUT_DEFINITIONS),
    provideAnxLayoutDefaults(ANX_DEFAULT_LAYOUT_DEFAULTS),
  ];
}
