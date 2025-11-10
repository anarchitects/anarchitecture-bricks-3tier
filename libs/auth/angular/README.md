# @anarchitects/auth-angular

Angular bricks for the Anarchitecture auth domain. The library is organized into standalone feature slices (config, data-access, feature, state, ui) that compose together to provide contract-driven authentication flows for Angular applications.

## Features

- `data-access`: generated OpenAPI clients plus facades to call the Nest API
- `state`: signal-based store that drives login/logout and other auth flows
- `feature`: orchestrating services/components that wire UI to state/data
- `config`: DI tokens and provider helpers (API base URL, defaults)
- `ui`: presentational components (if present in future expansions)

## Installation

```bash
npm install @anarchitects/auth-angular
# or
yarn add @anarchitects/auth-angular
```

Peer dependencies: Angular v20+, `@ngrx/signals`, `@sinclair/typebox`, and the sibling packages `@anarchitects/auth-ts` & `@anarchitects/auth-nest` (for end-to-end flows).

## Usage

### Quick start

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideAuthConfig } from '@anarchitects/auth-angular/config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAuthConfig({
      apiBaseUrl: 'https://api.anarchitects.dev',
    }),
  ],
};
```

```ts
// app.component.ts
import { Component, inject } from '@angular/core';
import { AuthStore } from '@anarchitects/auth-angular/state';

@Component({
  selector: 'app-root',
  template: `
    <button (click)="login()">Login</button>
    <p *ngIf="store.isLoggedIn()">Welcome {{ store.loggedInUser()?.email }}</p>
  `,
})
export class AppComponent {
  readonly store = inject(AuthStore);

  login() {
    this.store.login({ credential: 'user@example.com', password: 'secret' });
  }
}
```

### Secondary entry points

| Import path                              | Description                               |
| ---------------------------------------- | ----------------------------------------- |
| `@anarchitects/auth-angular/config`      | DI tokens and providers                   |
| `@anarchitects/auth-angular/data-access` | Generated API clients and facades         |
| `@anarchitects/auth-angular/state`       | Signal store for auth workflows           |
| `@anarchitects/auth-angular/feature`     | Feature orchestration services/components |
| `@anarchitects/auth-angular/ui`          | Presentational components (if available)  |

## Nx scripts

- `nx build auth-angular` – build the Angular package
- `nx test auth-angular` – execute unit tests (Jest)
- `nx lint auth-angular` – run ESLint against the library

## Development notes

- DTO contracts live in `@anarchitects/auth-ts`; regenerate them when the API contract changes.
- Data-access layer should always use the generated OpenAPI clients—no manual HTTP calls.
- State layer uses Angular signals via `@ngrx/signals` for reactive updates.
- Keep UI, feature, data-access, state, and config layers decoupled per architecture guidelines.

## License

Licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0).
