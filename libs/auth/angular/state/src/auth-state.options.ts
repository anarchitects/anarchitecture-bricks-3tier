import { InjectionToken } from '@angular/core';

export type AuthRestoreFailureBehavior =
  | 'stayLoggedOut'
  | 'redirectToLogin';

export type AuthStateOptions = {
  restoreOnInit?: boolean;
  onRestoreFailure?: AuthRestoreFailureBehavior;
};

export const DEFAULT_AUTH_STATE_OPTIONS: Required<AuthStateOptions> = {
  restoreOnInit: true,
  onRestoreFailure: 'stayLoggedOut',
};

export const AUTH_STATE_OPTIONS = new InjectionToken<
  Required<AuthStateOptions>
>('AUTH_STATE_OPTIONS', {
  factory: () => DEFAULT_AUTH_STATE_OPTIONS,
});

export const resolveAuthStateOptions = (
  options: AuthStateOptions = {},
): Required<AuthStateOptions> => ({
  ...DEFAULT_AUTH_STATE_OPTIONS,
  ...options,
});
