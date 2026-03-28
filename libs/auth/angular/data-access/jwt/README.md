# @anarchitects/auth-angular/data-access/jwt

JWT plugin-specific data-access helpers for `@anarchitects/auth-angular`.

Use this entrypoint only when the JWT plugin is enabled on the Nest side. The root `@anarchitects/auth-angular/data-access` surface remains session-first and should be the default for core auth flows.

## Exports

- `JwtAuthApi`: HTTP adapter for `/auth/jwt/login`, `/auth/jwt/logout`, and `/auth/jwt/refresh`
- `withJwtAuthHttpInterceptors()`: interceptor helpers for JWT token injection and refresh behavior

## Usage

```ts
import { provideHttpClient } from '@angular/common/http';
import { withJwtAuthHttpInterceptors } from '@anarchitects/auth-angular/data-access/jwt';

export const appConfig = {
  providers: [provideHttpClient(withJwtAuthHttpInterceptors())],
};
```

Keep JWT orchestration in the JWT state layer. Feature code should depend on `@anarchitects/auth-angular/state/jwt`, not call `JwtAuthApi` directly.
