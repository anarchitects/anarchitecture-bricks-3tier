import {
  JwtAuthApi,
  storeTokens,
} from '@anarchitects/auth-angular/data-access/jwt';
import { RefreshTokenRequestDTO } from '@anarchitects/auth-ts/dtos/jwt';
import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

type AuthJwtState = {
  loading: boolean;
  error: string | null;
  success: boolean;
};

const initialState: AuthJwtState = {
  loading: false,
  error: null,
  success: false,
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

export const AuthJwtStore = signalStore(
  withState(initialState),
  withProps(() => ({
    _jwtAuthApi: inject(JwtAuthApi),
  })),
  withMethods((store) => ({
    async refreshTokens(dto: RefreshTokenRequestDTO): Promise<void> {
      if (!dto.refreshToken) {
        return;
      }

      patchState(store, {
        loading: true,
        error: null,
        success: false,
      });

      try {
        const tokens = await firstValueFrom(store._jwtAuthApi.refreshTokens(dto));
        storeTokens(tokens);
        patchState(store, {
          loading: false,
          success: true,
        });
      } catch (error) {
        patchState(store, {
          loading: false,
          error: toErrorMessage(error),
          success: false,
        });
        throw error;
      }
    },
  })),
);
