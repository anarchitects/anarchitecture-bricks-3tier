# @anarchitects/auth-angular/feature/jwt

JWT plugin-specific feature orchestration for `@anarchitects/auth-angular`.

Use this entrypoint only when the JWT plugin is enabled. It sits on top of `@anarchitects/auth-angular/state/jwt` and delegates rendering to `@anarchitects/auth-angular/ui/jwt`.

## Exports

- `AnarchitectsAuthJwtRefreshTokens`

## Usage

```ts
import { Component } from '@angular/core';
import { provideAuthJwtState } from '@anarchitects/auth-angular/state/jwt';
import { AnarchitectsAuthJwtRefreshTokens } from '@anarchitects/auth-angular/feature/jwt';

@Component({
  selector: 'app-refresh-page',
  imports: [AnarchitectsAuthJwtRefreshTokens],
  providers: [...provideAuthJwtState()],
  template: `<anarchitects-auth-jwt-refresh-tokens />`,
})
export class RefreshPageComponent {}
```

Keep feature orchestration on the state layer. Do not import `data-access/jwt` directly into feature code.
