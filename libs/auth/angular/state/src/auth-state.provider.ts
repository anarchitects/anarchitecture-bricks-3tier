import { Provider } from '@angular/core';
import { AuthStore } from './auth.store';

export function provideAuthState(): Provider {
  return AuthStore;
}
