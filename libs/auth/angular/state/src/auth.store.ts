import { AuthApi } from '@anarchitects/auth-angular/data-access';
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
import { User } from '@anarchitects/auth-ts/models';
import { computed, inject } from '@angular/core';
import { PureAbility } from '@casl/ability';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
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
import { jwtDecode } from 'jwt-decode';
import { EMPTY, pipe, switchMap, tap } from 'rxjs';

type AuthState = {
  loading: boolean;
  error: string | null;
  success: boolean;
  ability?: PureAbility;
};

type AuthUser = Pick<User, 'id' | 'email'>;

const initialState: AuthState = {
  loading: false,
  error: null,
  success: false,
  ability: undefined,
};

export const AuthStore = signalStore(
  withState(initialState),
  withEntities<AuthUser>(),
  withProps(() => ({
    _authApi: inject(AuthApi),
  })),
  withComputed((store) => ({
    isLoggedIn: computed(() => !!store.entities().length),
    loggedInUser: computed(() => store.entities()[0]),
  })),
  withMethods((store) => ({
    registerUser: rxMethod<RegisterRequestDTO>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((dto) =>
          store._authApi.registerUser(dto).pipe(
            tapResponse({
              next: ({ success }) => {
                patchState(store, { success });
              },
              error: (error: string) => {
                patchState(store, { error });
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
              error: (error: string) => {
                patchState(store, { error });
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
              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('refreshToken', refreshToken);
              const decoded = jwtDecode<{ sub?: string }>(accessToken);
              if (!decoded.sub) {
                patchState(store, { error: 'Invalid access token payload.' });
                return EMPTY;
              }
              return store._authApi.getLoggedInUserInfo();
            }),
            tapResponse({
              next: ({ user, rbac }) => {
                const authUser: AuthUser = {
                  id: user.id,
                  email: user.email,
                };
                patchState(store, setAllEntities([authUser]), {
                  ability: createAppAbility(rbac),
                  success: true,
                });
              },
              error: (error: string) => {
                patchState(store, { error });
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
          patchState(store, { loading: true, error: null, success: false });
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          patchState(store, removeAllEntities(), { ability: undefined });
        }),
        switchMap((dto) =>
          store._authApi.logout(dto).pipe(
            tapResponse({
              next: ({ success }) => {
                patchState(store, { success });
              },
              error: (error: string) => {
                patchState(store, { error });
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
              error: (error: string) => {
                patchState(store, { error });
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
              error: (error: string) => {
                patchState(store, { error });
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
              error: (error: string) => {
                patchState(store, { error });
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
              error: (error: string) => {
                patchState(store, { error });
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
              error: (error: string) => {
                patchState(store, { error });
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
              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('refreshToken', refreshToken);
              const decoded = jwtDecode<{ sub?: string }>(accessToken);
              if (!decoded.sub) {
                patchState(store, { error: 'Invalid access token payload.' });
                return EMPTY;
              }
              return store._authApi.getLoggedInUserInfo();
            }),
            tapResponse({
              next: ({ user, rbac }) => {
                const authUser: AuthUser = {
                  id: user.id,
                  email: user.email,
                };
                patchState(store, setAllEntities([authUser]), {
                  ability: createAppAbility(rbac),
                  success: true,
                });
              },
              error: (error: string) => {
                patchState(store, { error });
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
);
