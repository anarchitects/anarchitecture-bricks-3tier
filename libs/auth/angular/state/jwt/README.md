# @anarchitects/auth-angular/state/jwt

JWT plugin-specific state orchestration for `@anarchitects/auth-angular`.

Use this entrypoint only when the JWT plugin is enabled. The root `@anarchitects/auth-angular/state` entrypoint remains the default session-first state surface.

## Exports

- `AuthJwtStore`: JWT refresh-token orchestration state
- `provideAuthJwtState()`: explicit provider helper for the JWT state scope

## Usage

```ts
import { provideAuthJwtState } from '@anarchitects/auth-angular/state/jwt';

export const appConfig = {
  providers: [...provideAuthJwtState()],
};
```

JWT feature components should orchestrate through this state layer instead of depending on `data-access/jwt` directly.
