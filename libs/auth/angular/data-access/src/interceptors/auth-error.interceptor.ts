import {
  HttpBackend,
  HttpClient,
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpStatusCode,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { injectApiResourcePath } from '@anarchitects/auth-angular/config';
import { LoginResponseDTO } from '@anarchitects/auth-ts/dtos';
import { Router } from '@angular/router';
import {
  catchError,
  finalize,
  Observable,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import {
  ACCESS_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  clearStoredTokens,
  getStoredToken,
  resolveUserIdFromAccessToken,
  storeTokens,
} from './auth-token.utils';

const AUTH_RETRY_ATTEMPTED = new HttpContextToken<boolean>(() => false);
const LOGIN_REDIRECT_PATH = '/login';

let refreshTokensRequest$: Observable<LoginResponseDTO> | null = null;

function isUnauthorizedError(error: unknown): error is HttpErrorResponse {
  return (
    error instanceof HttpErrorResponse &&
    (error.status === HttpStatusCode.Unauthorized ||
      error.status === HttpStatusCode.Forbidden)
  );
}

function isAuthPublicEndpoint(url: string, authBaseUrl: string): boolean {
  const publicEndpoints = [
    '/login',
    '/register',
    '/activate',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ];

  return publicEndpoints.some((endpoint) =>
    url.includes(`${authBaseUrl}${endpoint}`)
  );
}

function isRefreshEndpoint(url: string, authBaseUrl: string): boolean {
  return url.includes(`${authBaseUrl}/refresh-tokens/`);
}

function redirectToLogin(router: Router | null): void {
  if (router) {
    void router.navigateByUrl(LOGIN_REDIRECT_PATH);
    return;
  }

  if (typeof window !== 'undefined') {
    window.location.assign(LOGIN_REDIRECT_PATH);
  }
}

function getRefreshTokensRequest(
  http: HttpClient,
  refreshUrl: string,
  refreshToken: string
): Observable<LoginResponseDTO> {
  if (!refreshTokensRequest$) {
    refreshTokensRequest$ = http
      .post<LoginResponseDTO>(refreshUrl, { refreshToken })
      .pipe(
        tap((tokens) => storeTokens(tokens)),
        finalize(() => {
          refreshTokensRequest$ = null;
        }),
        shareReplay(1)
      );
  }

  return refreshTokensRequest$;
}

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const authBaseUrl = `/api/${injectApiResourcePath()}`;
  const backend = inject(HttpBackend);
  const router = inject(Router, { optional: true });
  const rawHttp = new HttpClient(backend);

  return next(req).pipe(
    catchError((error) => {
      if (!isUnauthorizedError(error)) {
        return throwError(() => error);
      }

      if (
        req.context.get(AUTH_RETRY_ATTEMPTED) ||
        isRefreshEndpoint(req.url, authBaseUrl) ||
        isAuthPublicEndpoint(req.url, authBaseUrl)
      ) {
        if (req.context.get(AUTH_RETRY_ATTEMPTED)) {
          clearStoredTokens();
          redirectToLogin(router ?? null);
        }

        return throwError(() => error);
      }

      const refreshToken = getStoredToken(REFRESH_TOKEN_STORAGE_KEY);
      const accessToken = getStoredToken(ACCESS_TOKEN_STORAGE_KEY);
      const userId = resolveUserIdFromAccessToken(accessToken);

      if (!refreshToken || !userId) {
        clearStoredTokens();
        redirectToLogin(router ?? null);
        return throwError(() => error);
      }

      const refreshUrl = `${authBaseUrl}/refresh-tokens/${userId}`;

      return getRefreshTokensRequest(rawHttp, refreshUrl, refreshToken).pipe(
        switchMap(({ accessToken: nextAccessToken }) => {
          const retryRequest = req.clone({
            context: req.context.set(AUTH_RETRY_ATTEMPTED, true),
            setHeaders: {
              Authorization: `Bearer ${nextAccessToken}`,
            },
          });

          return next(retryRequest);
        }),
        catchError((refreshError) => {
          clearStoredTokens();
          redirectToLogin(router ?? null);
          return throwError(() => refreshError);
        })
      );
    })
  );
};
