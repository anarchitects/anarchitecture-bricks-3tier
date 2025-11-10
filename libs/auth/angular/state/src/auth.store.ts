import { AuthApi } from '@anarchitects/auth-angular/data-access';
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
import { pipe, switchMap, tap } from 'rxjs';

type AuthState = {
  loading: boolean;
  error: string | null;
  success: boolean;
};

type AuthUser = Pick<User, 'id' | 'email'>;

const initialState: AuthState = {
  loading: false,
  error: null,
  success: false,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
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
            })
          )
        )
      )
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
            })
          )
        )
      )
    ),
    login: rxMethod<LoginRequestDTO>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((dto) =>
          store._authApi.login(dto).pipe(
            tapResponse({
              next: ({ accessToken, refreshToken }) => {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                const decoded = jwtDecode(accessToken);
                if (decoded.sub) {
                  const user: AuthUser = {
                    id: decoded.sub,
                    email: '', // Email can be fetched later if needed
                  };
                  patchState(store, setAllEntities([user]));
                }
              },
              error: (error: string) => {
                patchState(store, { error });
              },
              finalize: () => {
                patchState(store, { loading: false });
              },
            })
          )
        )
      )
    ),
    logout: rxMethod<LogoutRequestDTO>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((dto) =>
          store._authApi.logout(dto).pipe(
            tapResponse({
              next: ({ success }) => {
                patchState(store, { success });
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                patchState(store, removeAllEntities());
              },
              error: (error: string) => {
                patchState(store, { error });
              },
              finalize: () => {
                patchState(store, { loading: false });
              },
            })
          )
        )
      )
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
            })
          )
        )
      )
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
            })
          )
        )
      )
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
            })
          )
        )
      )
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
            })
          )
        )
      )
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
            })
          )
        )
      )
    ),
    refreshTokens: rxMethod<{ userId: string; dto: RefreshTokenRequestDTO }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ userId, dto }) =>
          store._authApi.refreshTokens(userId, dto).pipe(
            tapResponse({
              next: ({ accessToken, refreshToken }) => {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                const decoded = jwtDecode(accessToken);
                if (decoded.sub) {
                  const user: AuthUser = {
                    id: decoded.sub,
                    email: '', // Email can be fetched later if needed
                  };
                  patchState(store, setAllEntities([user]));
                }
              },
              error: (error: string) => {
                patchState(store, { error });
              },
              finalize: () => {
                patchState(store, { loading: false });
              },
            })
          )
        )
      )
    ),
  }))
);
