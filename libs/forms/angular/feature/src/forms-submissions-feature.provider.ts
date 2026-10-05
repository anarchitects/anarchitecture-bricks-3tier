import { provideFormsState } from '@anarchitects/forms-angular/state';
import type { Provider } from '@angular/core';

/** Provide shared submission list/detail state in the consuming host scope. */
export function provideFormsSubmissionsFeature(): Provider[] {
  return provideFormsState();
}
