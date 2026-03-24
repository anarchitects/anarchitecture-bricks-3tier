import { AuthApi } from '@anarchitects/auth-angular/data-access';
import {
  ACCESS_TOKEN_STORAGE_KEY,
  clearStoredTokens,
  getStoredToken,
  resolveUserIdFromAccessToken,
  storeTokens,
} from '@anarchitects/auth-angular/data-access';
import { createAppAbility } from '@anarchitects/auth-angular/util';
import {
  ActivateUserRequestDTO,
  ChangePasswordRequestDTO,
  ForgotPasswordRequestDTO,
  LoginRequestDTO,
  LogoutRequestDTO,
  RefreshTokenRequestDTO,
  RegisterRequestDTO,
  ResetPasswordRequestDTO,
  UpdateEmailRequestDTO,
  VerifyEmailRequestDTO,
} from '@anarchitects/auth-ts/dtos';
import { PolicyRule, User } from '@anarchitects/auth-ts/models';
import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import {
  removeAllEntities,
  setAllEntities,
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, pipe, switchMap, tap, throwError } from 'rxjs';
import { AUTH_STATE_OPTIONS } from './auth-state.options';

type AuthState = {
  loading: boolean;
  error: string | null;
  success: boolean;
  ability: ReturnType<typeof createAppAbility> | undefined;
  rbac: PolicyRule[];
  initialized: boolean;
  restoring: boolean;
};

type AuthUser = Pick<User, 'id' | 'email'>;

const LOGIN_REDIRECT_PATH = '/login';

const initialState: AuthState = {
  loading: false,
  error: null,
  success: false,
  ability: undefined,
  rbac: [],
  initialized: false,
  restoring: false,
};

const toErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return 'Request failed.';
};

const patchAuthenticatedSession = (
  store: object,
  session: { user: AuthUser; rbac: PolicyRule[] },
) => {
  patchState(
    store as never,
    setAllEntities([session.user]),
    {
      ability: createAppAbility(session.rbac),
      error: null,
      rbac: session.rbac,
      success: true,
    },
  );
};

const clearAuthenticatedSession = (
  store: object,
  state: Partial<AuthState> = {},
) => {
  patchState(
    store as never,
    removeAllEntities(),
    {
      ability: undefined,
      rbac: [],
      success: false,
      ...state,
    },
  );
};

const redirectToLogin = (router: Router | null): void => {
  if (router) {
    void router.navigateByUrl(LOGIN_REDIRECT_PATH);
    return;
  }

  if (typeof window !== 'undefined') {
    window.location.assign(LOGIN_REDIRECT_PATH);
  }
};

const failClosedHydration = (
  store: object,
  error: unknown,
  state: Partial<AuthState> = {},
) => {
  clearStoredTokens();
  clearAuthenticatedSession(store, {
    error: toErrorMessage(error),
    ...state,
  });
};

export const AuthStore = signalStore(
  withState(initialState),
  withEntities<AuthUser>(),
  withProps(() => ({
    _authApi: inject(AuthApi),
    _authStateOptions: inject(AUTH_STATE_OPTIONS),
    _router: inject(Router, { optional: true }),
  })),
  withComputed((store) => ({
    isLoggedIn: computed(() => !!store.entities().length),
    loggedInUser: computed(() => store.entities()[0]),
  })),
  withMethods((store) => ({
    restoreSession: rxMethod<void>(
      pipe(
        tap(() => {
          if (!store._authStateOptions.restoreOnInit || store.initialized()) {
            patchState(store, { initialized: true, restoring: false });
            return;
          }

          patchState(store, {
            error: null,
            restoring: true,
            success: false,
          });
        }),
        switchMap(() => {
          if (!store._authStateOptions.restoreOnInit || store.initialized()) {
            return EMPTY;
          }

          const accessToken = getStoredToken(ACCESS_TOKEN_STORAGE_KEY);

          if (!accessToken) {
            patchState(store, { initialized: true, restoring: false });
            return EMPTY;
          }

          if (!resolveUserIdFromAccessToken(accessToken)) {
            clearStoredTokens();
            clearAuthenticatedSession(store, {
              error: 'Invalid access token payload.',
              initialized: true,
              restoring: false,
            });

            if (store._authStateOptions.onRestoreFailure === 'redirectToLogin') {
              redirectToLogin(store._router);
            }

            return EMPTY;
          }

          return store._authApi
            .getLoggedInUserInfo({
              suppressAuthFailureRedirect:
                store._authStateOptions.onRestoreFailure === 'stayLoggedOut',
            })
            .pipe(
              tapResponse({
                next: ({ user, rbac }) => {
                  patchAuthenticatedSession(store, {
                    user: {
                      email: user.email,
                      id: user.id,
                    },
                    rbac,
                  });
                  patchState(store, {
                    initialized: true,
                    restoring: false,
                  });
                },
                error: (error: unknown) => {
                  clearStoredTokens();
                  clearAuthenticatedSession(store, {
                    error: toErrorMessage(error),
                    initialized: true,
                    restoring: false,
                  });

                  if (
                    store._authStateOptions.onRestoreFailure ===
                    'redirectToLogin'
                  ) {
                    redirectToLogin(store._router);
                  }
                },
              }),
            );
        }),
      ),
    ),
    registerUser: rxMethod<RegisterRequestDTO>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((dto) =>
          store._authApi.registerUser(dto).pipe(
            tapResponse({
              next: ({ success }) => {
                patchState(store, { success });
              },
              error: (error: unknown) => {
                patchState(store, { error: toErrorMessage(error) });
              },
              finalize: () => {
                patchState(store, { loading: false });
              },
            }),
          ),
        ),
      ),
    ),
    activateUser: rxMethod<ActivateUserRequestDTO>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((dto) =>
          store._authApi.activateUser(dto).pipe(
            tapResponse({
              next: ({ success }) => {
                patchState(store, { success });
              },
              error: (error: unknown) => {
                patchState(store, { error: toErrorMessage(error) });
              },
              finalize: () => {
                patchState(store, { loading: false });
              },
            }),
          ),
        ),
      ),
    ),
    login: rxMethod<LoginRequestDTO>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((dto) =>
          store._authApi.login(dto).pipe(
            switchMap(({ accessToken, refreshToken }) => {
              storeTokens({ accessToken, refreshToken });

              if (!resolveUserIdFromAccessToken(accessToken)) {
                clearStoredTokens();
                patchState(store, { error: 'Invalid access token payload.' });
                return EMPTY;
              }

              return store._authApi.getLoggedInUserInfo().pipe(
                catchError((error: unknown) => {
                  failClosedHydration(store, error, { initialized: true });
                  return throwError(() => error);
                }),
              );
            }),
            tapResponse({
              next: ({ user, rbac }) => {
                patchAuthenticatedSession(store, {
                  user: {
                    email: user.email,
                    id: user.id,
                  },
                  rbac,
                });
                patchState(store, { initialized: true });
              },
              error: (error: unknown) => {
                patchState(store, {
                  error: toErrorMessage(error),
                  initialized: true,
                });
              },
              finalize: () => {
                patchState(store, { loading: false });
              },
            }),
          ),
        ),
      ),
    ),
    logout: rxMethod<LogoutRequestDTO>(
      pipe(
        tap(() => {
          patchState(store, { error: null, loading: true, success: false });
          clearStoredTokens();
          clearAuthenticatedSession(store, { initialized: true });
        }),
        switchMap((dto) =>
          store._authApi.logout(dto).pipe(
            tapResponse({
              next: ({ success }) => {
                patchState(store, { success });
              },
              error: (error: unknown) => {
                patchState(store, { error: toErrorMessage(error) });
              },
              finalize: () => {
                patchState(store, { loading: false });
              },
            }),
          ),
        ),
      ),
    ),
    changePassword: rxMethod<{ userId: string; dto: ChangePasswordRequestDTO }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ userId, dto }) =>
          store._authApi.changePassword(userId, dto).pipe(
            tapResponse({
              next: ({ success }) => {
                patchState(store, { success });
              },
              error: (error: unknown) => {
                patchState(store, { error: toErrorMessage(error) });
              },
              finalize: () => {
                patchState(store, { loading: false });
              },
            }),
          ),
        ),
      ),
    ),
    forgotPassword: rxMethod<ForgotPasswordRequestDTO>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((dto) =>
          store._authApi.forgotPassword(dto).pipe(
            tapResponse({
              next: ({ success }) => {
                patchState(store, { success });
              },
              error: (error: unknown) => {
                patchState(store, { error: toErrorMessage(error) });
              },
              finalize: () => {
                patchState(store, { loading: false });
              },
            }),
          ),
        ),
      ),
    ),
    resetPassword: rxMethod<{ dto: ResetPasswordRequestDTO }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ dto }) =>
          store._authApi.resetPassword(dto).pipe(
            tapResponse({
              next: ({ success }) => {
                patchState(store, { success });
              },
              error: (error: unknown) => {
                patchState(store, { error: toErrorMessage(error) });
              },
              finalize: () => {
                patchState(store, { loading: false });
              },
            }),
          ),
        ),
      ),
    ),
    verifyEmail: rxMethod<VerifyEmailRequestDTO>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((dto) =>
          store._authApi.verifyEmail(dto).pipe(
            tapResponse({
              next: ({ success }) => {
                patchState(store, { success });
              },
              error: (error: unknown) => {
                patchState(store, { error: toErrorMessage(error) });
              },
              finalize: () => {
                patchState(store, { loading: false });
              },
            }),
          ),
        ),
      ),
    ),
    updateEmail: rxMethod<{ userId: string; dto: UpdateEmailRequestDTO }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ userId, dto }) =>
          store._authApi.updateEmail(userId, dto).pipe(
            tapResponse({
              next: ({ success }) => {
                patchState(store, { success });
              },
              error: (error: unknown) => {
                patchState(store, { error: toErrorMessage(error) });
              },
              finalize: () => {
                patchState(store, { loading: false });
              },
            }),
          ),
        ),
      ),
    ),
    refreshTokens: rxMethod<{ userId: string; dto: RefreshTokenRequestDTO }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ userId, dto }) =>
          store._authApi.refreshTokens(userId, dto).pipe(
            switchMap(({ accessToken, refreshToken }) => {
              storeTokens({ accessToken, refreshToken });

              if (!resolveUserIdFromAccessToken(accessToken)) {
                clearStoredTokens();
                patchState(store, { error: 'Invalid access token payload.' });
                return EMPTY;
              }

              return store._authApi.getLoggedInUserInfo().pipe(
                catchError((error: unknown) => {
                  failClosedHydration(store, error, { initialized: true });
                  return throwError(() => error);
                }),
              );
            }),
            tapResponse({
              next: ({ user, rbac }) => {
                patchAuthenticatedSession(store, {
                  user: {
                    email: user.email,
                    id: user.id,
                  },
                  rbac,
                });
                patchState(store, { initialized: true });
              },
              error: (error: unknown) => {
                patchState(store, {
                  error: toErrorMessage(error),
                  initialized: true,
                });
              },
              finalize: () => {
                patchState(store, { loading: false });
              },
            }),
          ),
        ),
      ),
    ),
  })),
  withHooks((store) => ({
    onInit() {
      store.restoreSession();
    },
  })),
);
