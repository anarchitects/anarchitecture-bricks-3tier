import { Provider } from '@angular/core';
import { IdentityApi } from './identity-api';

export function provideIdentityDataAccess(): Provider[] {
  return [IdentityApi];
}
