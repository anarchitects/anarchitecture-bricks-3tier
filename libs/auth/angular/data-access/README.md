# @anarchitects/auth-angular/data-access

HTTP adapters that bridge Angular apps to the auth Nest API using the OpenAPI-generated DTOs. Import from `@anarchitects/auth-angular/data-access` for the session-first core auth surface.

## Exports

- `AuthApi`: injectable service backed by Angular `HttpClient`
- Uses configuration from `@anarchitects/auth-angular/config` to resolve the `/api/{resource}` path
- Methods map to the core session-oriented auth surface (`registerUser`, `login`, `logout`, `getLoggedInUserInfo`, etc.)
- JWT plugin helpers live under `@anarchitects/auth-angular/data-access/jwt`

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

## JWT plugin usage

```ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { withJwtAuthHttpInterceptors } from '@anarchitects/auth-angular/data-access/jwt';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withJwtAuthHttpInterceptors())],
};
```

## Authorization Payload Expectations

`AuthApi.getLoggedInUserInfo()` is the frontend trust boundary for `/auth/me` authorization data:

- it expects `rbac` to match the shared `PolicyRule` contract from `@anarchitects/auth-ts`
- malformed `rbac` payloads are rejected fail-closed before they reach `AuthStore`
- bootstrap restore may suppress forced login redirects while still rejecting malformed authorization data

Use the state and util layers for authorization behavior after this boundary rather than trusting raw HTTP JSON in feature/UI code.
