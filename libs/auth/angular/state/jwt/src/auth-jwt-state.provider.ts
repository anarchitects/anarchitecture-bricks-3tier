import { Provider } from '@angular/core';
import { AuthJwtStore } from './auth-jwt.store';

export function provideAuthJwtState(): Provider[] {
  return [AuthJwtStore];
}
