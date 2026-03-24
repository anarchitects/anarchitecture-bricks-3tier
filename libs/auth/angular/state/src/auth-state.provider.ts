import {
  EnvironmentProviders,
  inject,
  provideEnvironmentInitializer,
  Provider,
} from '@angular/core';
import { AuthStore } from './auth.store';
import {
  AUTH_STATE_OPTIONS,
  AuthStateOptions,
  resolveAuthStateOptions,
} from './auth-state.options';

export function provideAuthState(
  options: AuthStateOptions = {},
): Array<Provider | EnvironmentProviders> {
  return [
    { provide: AUTH_STATE_OPTIONS, useValue: resolveAuthStateOptions(options) },
    AuthStore,
    provideEnvironmentInitializer(() => {
      inject(AuthStore);
    }),
  ];
}
