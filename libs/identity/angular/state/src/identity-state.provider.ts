import { Provider } from '@angular/core';
import { IdentityStore } from './identity.store';

export function provideIdentityState(): Provider[] {
  return [IdentityStore];
}
