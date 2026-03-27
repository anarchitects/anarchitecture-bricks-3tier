import { injectAuthConfig } from '@anarchitects/auth-angular/config';
import { HttpInterceptorFn } from '@angular/common/http';
import { ACCESS_TOKEN_STORAGE_KEY, getStoredToken } from './auth-token.utils';

export const authBearerTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authConfig = injectAuthConfig();
  if (!authConfig.plugins.jwt.enabled) {
    return next(req);
  }

  const accessToken = getStoredToken(ACCESS_TOKEN_STORAGE_KEY);

  if (!accessToken || req.headers.has('Authorization')) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  );
};
