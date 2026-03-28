import { HttpInterceptorFn, withInterceptors } from '@angular/common/http';
import { authBearerTokenInterceptor } from './bearer-token.interceptor';
import { authErrorInterceptor } from './auth-error.interceptor';

export const JWT_AUTH_HTTP_INTERCEPTORS: HttpInterceptorFn[] = [
  authBearerTokenInterceptor,
  authErrorInterceptor,
];

export function withJwtAuthHttpInterceptors() {
  return withInterceptors(JWT_AUTH_HTTP_INTERCEPTORS);
}

export * from './bearer-token.interceptor';
export * from './auth-error.interceptor';
export * from './auth-token.utils';
