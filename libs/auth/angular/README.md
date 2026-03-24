# @anarchitects/auth-angular

Angular domain libraries for the Anarchitecture auth domain. The package is organized into standalone slices (config, data-access, feature, state, util, ui) that compose implementation-aligned authentication flows for Angular applications.

## Developer + AI Agent Start Here

- Read this README before generating integration code for `@anarchitects/auth-angular`.
- Use public entry points only (`config`, `data-access`, `feature`, `state`, `util`, `ui`); do not import internal files.
- Register providers and state explicitly via `provideAuthConfig`, `provideAuthDataAccess`, and `provideAuthState`.
- Keep policy and ability behavior aligned with contracts from `@anarchitects/auth-ts`.
- Preserve Angular layering and keep orchestration out of UI components.

## Features

- `config`: DI tokens and provider helpers (API base URL, defaults)
- `data-access`: generated OpenAPI clients plus adapters over the Nest API
- `state`: signal-based store plus explicit provider helper for login/logout, token refresh, eager session restore, and ability hydration
- `feature`: coarse route guard, resource-aware route guard, and orchestration components that delegate rendering to auth UI components
- `util`: CASL ability helpers (`createAppAbility`, `canAccessResource`, `canAccessResourceField`, `AppAbility`)
- `ui`: presentational auth domain form components built on `AnarchitectsUiForm`

## Authorization Model

CASL integration in `@anarchitects/auth-angular` mirrors the backend split instead of pretending every check is the same:

- `policyGuard` is coarse and answers "may this user attempt work on this subject at all?"
- `resourcePolicyGuard` checks a resolved concrete resource route
- `canAccessResource(...)` and `canAccessResourceField(...)` are the intended UI checks for edit buttons, row actions, and field-sensitive affordances
- `AuthStore` hydrates both raw `rbac` rules and the derived CASL ability

Angular should hide or redirect on unauthorized work, but Nest remains the final enforcement boundary for instance-sensitive access.

## Installation

```bash
npm install @anarchitects/auth-angular @angular/common @angular/core @angular/router @ngrx/operators @ngrx/signals rxjs
# or
yarn add @anarchitects/auth-angular @angular/common @angular/core @angular/router @ngrx/operators @ngrx/signals rxjs
```

Peer requirements:

- `@angular/common`, `@angular/core`, `@angular/router`
- `@ngrx/operators`, `@ngrx/signals`, `rxjs`

The internal `@anarchitects/auth-ts`, `@anarchitects/forms-angular`, `@anarchitects/forms-ts`, and shared layout packages are installed transitively. Runtime utilities such as `jwt-decode` and `@casl/ability` are bundled as direct dependencies of this package.

## Usage

### Quick start

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideAuthConfig } from '@anarchitects/auth-angular/config';
import { provideAuthDataAccess } from '@anarchitects/auth-angular/data-access';
import { provideAuthState } from '@anarchitects/auth-angular/state';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAuthConfig({
      apiBaseUrl: 'https://api.anarchitects.dev',
    }),
    provideAuthDataAccess(),
    ...provideAuthState(),
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

```ts
// app.routes.ts
import { Routes } from '@angular/router';
import {
  policyGuard,
  resourcePolicyGuard,
} from '@anarchitects/auth-angular/feature';

export const routes: Routes = [
  {
    path: 'admin',
    canMatch: [policyGuard],
    data: { action: 'manage', subject: 'admin-section' },
    loadComponent: () =>
      import('./admin.component').then((m) => m.AdminComponent),
  },
  {
    path: 'posts/:postId/edit',
    canMatch: [policyGuard],
    canActivate: [resourcePolicyGuard],
    data: {
      action: 'update',
      subject: 'Post',
      resourceKey: 'post',
      unauthorizedRedirectTo: '/posts',
    },
    loadComponent: () =>
      import('./post-edit.component').then((m) => m.PostEditComponent),
  },
];
```

`policyGuard` is a coarse route-attempt guard. It answers "may this user attempt work on this subject at all?" by using the shared route matcher from `@anarchitects/auth-ts`. Concrete ownership checks still belong to loaded resources. Use `resourcePolicyGuard` for resolved edit/detail routes and `canAccessResource(...)` / `canAccessResourceField(...)` for UI elements such as edit buttons.

Blog ownership example:

```ts
import { Component, computed, inject, input } from '@angular/core';
import {
  canAccessResource,
  canAccessResourceField,
} from '@anarchitects/auth-angular/util';
import { AuthStore } from '@anarchitects/auth-angular/state';

@Component({
  selector: 'app-post-actions',
  template: `
    @if (canEdit()) {
      <a [routerLink]="['/posts', post().id, 'edit']">Edit</a>
    }
    @if (canEditTitle()) {
      <button type="button">Rename title</button>
    }
  `,
})
export class PostActionsComponent {
  readonly post = input.required<{ id: string; authorId: string }>();
  private readonly authStore = inject(AuthStore);

  readonly canEdit = computed(() =>
    canAccessResource(
      this.authStore.ability(),
      'update',
      'Post',
      this.post(),
    ),
  );

  readonly canEditTitle = computed(() =>
    canAccessResourceField(
      this.authStore.ability(),
      'update',
      'Post',
      'title',
      this.post(),
    ),
  );
}
```

## Entry points

| Import path                              | Description                             |
| ---------------------------------------- | --------------------------------------- |
| `@anarchitects/auth-angular/config`      | DI tokens and providers                 |
| `@anarchitects/auth-angular/data-access` | Generated API clients and HTTP adapters |
| `@anarchitects/auth-angular/state`       | Signal store, eager restore, CASL ability sync |
| `@anarchitects/auth-angular/feature`     | Coarse and resource-aware router guards |
| `@anarchitects/auth-angular/ui`          | Auth domain form UI components          |
| `@anarchitects/auth-angular/util`        | CASL ability/resource helpers and typings |

## Nx scripts

- `nx build auth-angular` – build the Angular package
- `nx test auth-angular` – execute unit tests (Jest)
- `nx lint auth-angular` – run ESLint against the library

## Development notes

- DTOs live in `@anarchitects/auth-ts`; regenerate OpenAPI docs when route schemas change (`nx run api-specs:generate`).
- Data-access layer should always use the generated OpenAPI clients—no manual HTTP calls.
- State layer uses Angular signals via `@ngrx/signals` for reactive updates, hydrates raw RBAC rules plus the derived CASL ability, and restores sessions eagerly when provided.
- `AuthStore.initialized()` and `AuthStore.restoring()` let apps avoid auth flicker while bootstrap restore completes.
- `/auth/me` RBAC payloads are parsed at the frontend trust boundary; malformed authorization data fails closed instead of producing a partially trusted ability.
- Ability creation and concrete resource checks are centralised in `@anarchitects/auth-angular/util`; import the helpers instead of instantiating CASL directly.
- `policyGuard` is coarse by design; use `resourcePolicyGuard` and backend instance checks for ownership-sensitive routes.
- Keep UI, feature, data-access, state, and config layers decoupled per architecture guidelines.

## License

Licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0).
