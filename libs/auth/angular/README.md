# @anarchitects/auth-angular

Angular domain libraries for the Anarchitecture auth domain. The package is organized into standalone slices (config, data-access, feature, state, util, ui) that compose implementation-aligned authentication flows for Angular applications.

Migration guidance for the Better Auth realignment lives in the [auth migration guide](../../../docs/guides/auth-migration.md).
Migration guidance for the contract-driven auth profile model lives in the [auth contract migration guide](../../../docs/guides/auth-contracts-migration.md).
Migration guidance for the Angular 22 Signal Forms and Tailwind transition lives in the
[frontend migration guide](../../../docs/guides/angular-22-signal-forms-tailwind-migration.md).

## Developer + AI Agent Start Here

- Read this README before generating integration code for `@anarchitects/auth-angular`.
- Use public entry points only (`config`, `data-access`, `feature`, `state`, `util`, `ui`, plus layer-scoped plugin subpaths like `data-access/jwt`); do not import internal files.
- Register providers and state explicitly via `provideAuthConfig`, Angular `provideHttpClient(...)`, and `provideAuthState`.
- Keep policy and ability behavior aligned with contracts from `@anarchitects/auth-ts`.
- Preserve Angular layering and keep orchestration out of UI components.

## Features

- `config`: DI tokens and provider helpers (API resource path, defaults)
- `config`: DI tokens and provider helpers for auth contract profiles via `provideAuthContracts(...)`
- `data-access`: generated OpenAPI clients plus adapters over the Nest API
- `state`: signal-based store plus explicit provider helper for core session login/logout, eager session restore, and ability hydration; session user data aligns with the shared `AuthUser` contract from `@anarchitects/auth-ts`
- `feature`: coarse route guard, resource-aware route guard, and orchestration components that delegate rendering to auth UI components
- `util`: CASL ability helpers (`createAppAbility`, `canAccessResource`, `canAccessResourceField`, `AppAbility`)
- `ui`: presentational Angular 22 Signal Forms components built on `AnarchitectsUiForm`
  and styled through `@anarchitects/tailwind`

## Authorization Model

CASL integration in `@anarchitects/auth-angular` mirrors the backend split instead of pretending every check is the same:

- `policyGuard` is coarse and answers "may this user attempt work on this subject at all?"
- `resourcePolicyGuard` checks a resolved concrete resource route
- `canAccessResource(...)` and `canAccessResourceField(...)` are the intended UI checks for edit buttons, row actions, and field-sensitive affordances
- `AuthStore` hydrates both raw `rbac` rules and the derived CASL ability

Angular should hide or redirect on unauthorized work, but Nest remains the final enforcement boundary for instance-sensitive access.

That mirrors the package split on the backend:

- `@anarchitects/auth-declarations` declares controller security intent
- `@anarchitects/auth-nest` performs runtime enforcement
- Angular guards and helpers exist for UX flow and preflight checks, not as a replacement for backend authorization

## Installation

```bash
npm install @anarchitects/auth-angular @anarchitects/tailwind @angular/common @angular/core @angular/forms @angular/router @ngrx/operators @ngrx/signals rxjs
# or
yarn add @anarchitects/auth-angular @anarchitects/tailwind @angular/common @angular/core @angular/forms @angular/router @ngrx/operators @ngrx/signals rxjs
```

Peer requirements:

- Angular 22: `@angular/common`, `@angular/core`, `@angular/forms`, and
  `@angular/router`
- NgRx 22: `@ngrx/operators` and `@ngrx/signals`
- `@anarchitects/tailwind ^0.0.1` and RxJS 7.8

Import the Tailwind foundation and include the published auth and forms templates in
source detection:

```css
/* styles.css */
@import '@anarchitects/tailwind';

@source './app';
@source '../node_modules/@anarchitects/auth-angular';
@source '../node_modules/@anarchitects/forms-angular';
```

The internal `@anarchitects/auth-ts`, `@anarchitects/forms-angular`, and
`@anarchitects/forms-ts` packages are installed transitively. Runtime utilities such
as `jwt-decode` and `@casl/ability` are bundled as direct dependencies.

## Usage

### Quick start

```ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAuthConfig, provideAuthContracts } from '@anarchitects/auth-angular/config';
import { provideAuthState } from '@anarchitects/auth-angular/state';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    ...provideAuthConfig({
      apiResourcePath: 'auth',
    }),
    ...provideAuthContracts(),
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
import { policyGuard, resourcePolicyGuard } from '@anarchitects/auth-angular/feature';

export const routes: Routes = [
  {
    path: 'admin',
    canMatch: [policyGuard],
    data: { action: 'manage', subject: 'admin-section' },
    loadComponent: () => import('./admin.component').then((m) => m.AdminComponent),
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
    loadComponent: () => import('./post-edit.component').then((m) => m.PostEditComponent),
  },
];
```

`policyGuard` is a coarse route-attempt guard. It answers "may this user attempt work on this subject at all?" by using the shared route matcher from `@anarchitects/auth-ts`. Concrete ownership checks still belong to loaded resources. Use `resourcePolicyGuard` for resolved edit/detail routes and `canAccessResource(...)` / `canAccessResourceField(...)` for UI elements such as edit buttons.

### Contract-driven auth forms

`@anarchitects/auth-angular` uses the same auth contract profile for rendered form rules and submit-time payload shaping.

- `provideAuthContracts(...)` supplies a profile override at app or feature scope.
- The UI form components read the resolved contract metadata through DI.
- `AuthStore` shapes outgoing payloads from the same contract profile before calling `AuthApi`.

Example: require a register name, make login passwords optional, and strip empty optional names before submit.

```ts
import { ApplicationConfig } from '@angular/core';
import { provideAuthContracts } from '@anarchitects/auth-angular/config';

export const appConfig: ApplicationConfig = {
  providers: [
    ...provideAuthContracts({
      register: {
        name: {
          required: true,
          minLength: 3,
          emptyStringPolicy: 'strip',
        },
      },
      login: {
        password: {
          required: false,
        },
      },
    }),
  ],
};
```

The auth UI components consume that profile automatically:

```ts
import { Component } from '@angular/core';
import { AnarchitectsAuthUiRegisterForm } from '@anarchitects/auth-angular/ui';

@Component({
  selector: 'app-register-page',
  imports: [AnarchitectsAuthUiRegisterForm],
  template: `<anarchitects-auth-ui-register-form />`,
})
export class RegisterPageComponent {}
```

If you need the resolved contract object directly, use `injectAuthContracts()` from `@anarchitects/auth-angular/config`.

All auth UI and feature form components also accept `schemaExtensions`. Use it for
host-only Angular Signal Forms rules that do not belong in the portable auth contract:

```ts
import { validate } from '@angular/forms/signals';
import type { FormsSchemaExtension } from '@anarchitects/forms-angular/ui';

export const rejectBlockedAccount: FormsSchemaExtension = (path) => {
  validate(path['credential'], ({ value }) => (value() === 'blocked@example.com' ? { kind: 'blockedAccount', message: 'This account is blocked.' } : undefined));
};
```

```html
<anarchitects-auth-feature-login [schemaExtensions]="[rejectBlockedAccount]" />
```

### Payload shaping

Submit raw DTOs from components and let `AuthStore` apply the profile's `emptyStringPolicy` rules before the HTTP call.

```ts
import { Component, inject } from '@angular/core';
import { AuthStore } from '@anarchitects/auth-angular/state';

@Component({
  selector: 'app-register-action',
  template: `<button type="button" (click)="register()">Register</button>`,
})
export class RegisterActionComponent {
  private readonly authStore = inject(AuthStore);

  register() {
    this.authStore.registerUser({
      name: '',
      email: 'jane@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });
  }
}
```

With a contract such as `register.name.required = false` plus `emptyStringPolicy = 'strip'`, the store omits `name` from the outgoing request body instead of sending `name: ''`.

## AuthUser compatibility

- Preferred shared session type: `AuthUser` from `@anarchitects/auth-ts` or `@anarchitects/auth-ts/models`
- `AuthStore` intentionally keeps a smaller session snapshot derived from `AuthUser` (`id` and `email`) instead of storing the full user graph in client state
- Backend response compatibility is unchanged: the session payload still uses the field name `user`, even though the preferred shared contract type behind that field is now `AuthUser`

### Optional JWT plugin wiring

Keep the root auth surface session-first. Only wire the JWT plugin when the host app explicitly needs token-based flows:

```ts
import { provideHttpClient } from '@angular/common/http';
import { withJwtAuthHttpInterceptors } from '@anarchitects/auth-angular/data-access/jwt';
import { provideAuthJwtState } from '@anarchitects/auth-angular/state/jwt';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withJwtAuthHttpInterceptors()), ...provideAuthJwtState()],
};
```

Blog ownership example:

```ts
import { Component, computed, inject, input } from '@angular/core';
import { canAccessResource, canAccessResourceField } from '@anarchitects/auth-angular/util';
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

  readonly canEdit = computed(() => canAccessResource(this.authStore.ability(), 'update', 'Post', this.post()));

  readonly canEditTitle = computed(() => canAccessResourceField(this.authStore.ability(), 'update', 'Post', 'title', this.post()));
}
```

## Entry points

| Import path                                  | Description                                    |
| -------------------------------------------- | ---------------------------------------------- |
| `@anarchitects/auth-angular/config`          | DI tokens and providers                        |
| `@anarchitects/auth-angular/data-access`     | Generated API clients and HTTP adapters        |
| `@anarchitects/auth-angular/data-access/jwt` | JWT plugin APIs and interceptor helpers        |
| `@anarchitects/auth-angular/state`           | Signal store, eager restore, CASL ability sync |
| `@anarchitects/auth-angular/state/jwt`       | JWT refresh-token state orchestration          |
| `@anarchitects/auth-angular/feature`         | Coarse and resource-aware router guards        |
| `@anarchitects/auth-angular/feature/jwt`     | JWT refresh-token orchestration components     |
| `@anarchitects/auth-angular/ui`              | Auth domain form UI components                 |
| `@anarchitects/auth-angular/ui/jwt`          | JWT refresh-token form components              |
| `@anarchitects/auth-angular/util`            | CASL ability/resource helpers and typings      |

## Nx scripts

- `nx build auth-angular` – build the Angular package
- `nx test auth-angular` – execute unit tests (Vitest)
- `nx lint auth-angular` – run ESLint against the library

## Development notes

- DTOs live in `@anarchitects/auth-ts`; regenerate OpenAPI docs when route schemas change (`nx run api-specs:generate`).
- Data-access layer should always use the generated OpenAPI clients—no manual HTTP calls.
- State layer uses Angular signals via `@ngrx/signals` for reactive updates, hydrates raw RBAC rules plus the derived CASL ability, and restores Better Auth-backed sessions eagerly when provided.
- `AuthStore.initialized()` and `AuthStore.restoring()` let apps avoid auth flicker while bootstrap restore completes.
- `/auth/me` RBAC payloads are parsed at the frontend trust boundary; malformed authorization data fails closed instead of producing a partially trusted ability.
- Core root surfaces are session-first. JWT plugin helpers live under layer-scoped subpaths such as `@anarchitects/auth-angular/data-access/jwt`, `@anarchitects/auth-angular/state/jwt`, `@anarchitects/auth-angular/feature/jwt`, and `@anarchitects/auth-angular/ui/jwt`.
- Feature components must orchestrate through state entrypoints; they should not call data-access entrypoints directly.
- Ability creation and concrete resource checks are centralised in `@anarchitects/auth-angular/util`; import the helpers instead of instantiating CASL directly.
- `policyGuard` is coarse by design; use `resourcePolicyGuard` and backend instance checks for ownership-sensitive routes.
- Keep UI, feature, data-access, state, and config layers decoupled per architecture guidelines.

## Migrating to the Signal Forms release

This is a breaking Angular 22-only release:

- Auth form rendering, validation state, submission, and reset behavior now come from
  the Signal Forms-based `@anarchitects/forms-angular` package.
- `layout` now uses the forms-owned `FormsLayoutId` contract instead of the retired
  Common Angular layouts type.
- Auth no longer depends on Common Angular composition or layout packages. Template
  and slot projection use the directives exported by `@anarchitects/forms-angular/ui`.
- Applications must install and import `@anarchitects/tailwind`, including both auth
  and forms package paths in Tailwind `@source` detection.
- Default controls are native semantic elements. Custom CSS, DOM queries, and visual
  snapshots that targeted the retired Common Angular wrappers must be updated.

Auth DTOs, contract profiles, selectors, outputs, provider helpers, orchestration,
explicit state scoping, and public workflows remain unchanged.

## License

Licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0).
