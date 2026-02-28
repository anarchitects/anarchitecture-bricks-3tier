# @anarchitects/auth-angular/data-access

HTTP adapters that bridge Angular apps to the auth Nest API using the OpenAPI-generated DTOs. Import from `@anarchitects/auth-angular/data-access` when you need to call auth endpoints directly or wire them into feature/state layers.

## Exports

- `AuthApi`: injectable service backed by Angular `HttpClient`
- `authBearerTokenInterceptor`: adds `Authorization: Bearer <accessToken>` when an access token is stored
- `authErrorInterceptor`: handles `401/403`, attempts token refresh, retries request, and redirects to login on terminal auth failure
- `withAuthHttpInterceptors()`: convenience helper for `provideHttpClient(...)`
- Uses configuration from `@anarchitects/auth-angular/config` to resolve the `/api/{resource}` path
- Methods map 1:1 to contract operations (`registerUser`, `login`, `logout`, `refreshTokens`, etc.)

## Usage

```ts
import { Injectable } from '@angular/core';
import { AuthApi } from '@anarchitects/auth-angular/data-access';
import { LoginRequestDTO } from '@anarchitects/auth-ts/dtos';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  constructor(private readonly authApi: AuthApi) {}

  login(dto: LoginRequestDTO) {
    return this.authApi.login(dto);
  }
}
```

Prefer consuming `AuthApi` from orchestrating feature services or signal stores so UI components remain presentation-only.

## Interceptor usage

```ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { withAuthHttpInterceptors } from '@anarchitects/auth-angular/data-access';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withAuthHttpInterceptors())],
};
```
