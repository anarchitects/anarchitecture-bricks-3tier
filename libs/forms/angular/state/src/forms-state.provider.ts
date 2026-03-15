import { Provider } from '@angular/core';
import { FormsStore } from './forms.store';

export function provideFormsState(): Provider {
  return FormsStore;
}
