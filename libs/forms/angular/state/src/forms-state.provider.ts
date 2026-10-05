import { Provider } from '@angular/core';
import { FormsStore } from './forms.store';

/** Register forms state in the consuming app, route, or component injector. */
export function provideFormsState(): Provider[] {
  return [FormsStore];
}
