import {
  PasskeyApi,
  PasskeyBrowserError,
  WebAuthnClient,
} from '@anarchitects/auth-angular/data-access/passkeys';
import { AuthStore } from '@anarchitects/auth-angular/state';
import type { PasskeyRegistrationBeginRequestDTO } from '@anarchitects/auth-ts/dtos/passkeys';
import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import {
  defer,
  EMPTY,
  exhaustMap,
  Observable,
  pipe,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

export type PasskeyEnrollmentOptions = PasskeyRegistrationBeginRequestDTO & {
  name?: string;
};

export const AuthPasskeyStore = signalStore(
  withState({
    loading: false,
    success: false,
    cancelled: false,
    error: null as string | null,
  }),
  withProps(() => ({
    _api: inject(PasskeyApi),
    _browser: inject(WebAuthnClient),
    _auth: inject(AuthStore),
  })),
  withMethods((store) => {
    const cancel = new Subject<void>();
    const run = (operation: () => Observable<unknown>) => {
      if (store.loading()) return EMPTY;
      return defer(() => {
        patchState(store, {
          loading: true,
          success: false,
          cancelled: false,
          error: null,
        });
        if (!store._browser.isSupported())
          throw new PasskeyBrowserError(
            'unsupported',
            'Passkeys are not supported in this browser.',
          );
        return operation();
      }).pipe(
        takeUntil(cancel),
        tapResponse({
          next: () => patchState(store, { success: true }),
          error: (error: unknown) =>
            patchState(store, {
              success: false,
              cancelled:
                error instanceof PasskeyBrowserError &&
                error.kind === 'cancelled',
              error:
                error instanceof PasskeyBrowserError &&
                error.kind === 'cancelled'
                  ? null
                  : error instanceof Error
                    ? error.message
                    : 'Passkey request failed.',
            }),
          finalize: () => patchState(store, { loading: false }),
        }),
      );
    };
    return {
      isSupported: () => store._browser.isSupported(),
      enroll: rxMethod<PasskeyEnrollmentOptions>(
        pipe(
          exhaustMap(({ name, ...dto }) =>
            run(() =>
              store._api.beginRegistration(dto).pipe(
                switchMap((options) => store._browser.create(options)),
                switchMap((response) =>
                  store._api.finishRegistration({
                    response,
                    ...(name === undefined ? {} : { name }),
                  }),
                ),
              ),
            ),
          ),
        ),
      ),
      signIn: rxMethod<void>(
        pipe(
          exhaustMap(() =>
            run(() =>
              store._api.beginAuthentication().pipe(
                switchMap((options) => store._browser.get(options)),
                switchMap((response) =>
                  store._api.finishAuthentication({ response }),
                ),
                tap((session) => store._auth.acceptSession(session)),
              ),
            ),
          ),
        ),
      ),
      cancel() {
        if (!store.loading()) return;
        cancel.next();
        patchState(store, { cancelled: true, success: false, error: null });
      },
    };
  }),
);
