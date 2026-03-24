import { HttpInterceptorFn, withInterceptors } from '@angular/common/http';
import { authBearerTokenInterceptor } from './bearer-token.interceptor';
import { authErrorInterceptor } from './auth-error.interceptor';

export const AUTH_HTTP_INTERCEPTORS: HttpInterceptorFn[] = [
  authBearerTokenInterceptor,
  authErrorInterceptor,
];

export function withAuthHttpInterceptors() {
  return withInterceptors(AUTH_HTTP_INTERCEPTORS);
}

export * from './bearer-token.interceptor';
export * from './auth-error.interceptor';
export * from './auth-token.utils';
