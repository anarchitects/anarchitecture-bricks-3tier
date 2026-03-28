# @anarchitects/auth-angular/state

Signal-based state management for the auth domain. Import from `@anarchitects/auth-angular/state` to orchestrate the session-first core auth flows without wiring up NgRx reducers manually. JWT plugin state lives under `@anarchitects/auth-angular/state/jwt`.

## Exports

- `AuthStore`: an Angular `signalStore` that exposes:
  - computed selectors (`isLoggedIn`, `loggedInUser`)
  - bootstrap status (`initialized`, `restoring`)
  - hydrated authorization state (`rbac`, `ability`)
  - async methods for each auth use case (`login`, `logout`, `registerUser`, etc.)
- `provideAuthState(options?)`: provider helper for explicit store registration (app/route scope) with eager bootstrap restore
- `@anarchitects/auth-angular/state/jwt`: JWT plugin state helpers such as `AuthJwtStore` and `provideAuthJwtState()`
- The store depends on `AuthApi` from the data-access layer and respects the configuration providers.

## Usage

```ts
import { Component, inject } from '@angular/core';
import { AuthStore, provideAuthState } from '@anarchitects/auth-angular/state';

@Component({
  selector: 'auth-login-button',
  template: `
    <button (click)="onLogin()" [disabled]="store.loading()">Sign in</button>
    <p *ngIf="store.error()">{{ store.error() }}</p>
  `,
})
export class AuthLoginButtonComponent {
  readonly store = inject(AuthStore);

  onLogin() {
    this.store.login({ credential: 'user@example.com', password: 'secret' });
  }
}
```

Register `provideAuthState()` in your application or route providers so the auth store scope is explicit and shared where needed. Keep UI components dumb by binding to the store's signals.

```ts
bootstrapApplication(AppComponent, {
  providers: [
    ...provideAuthState({
      restoreOnInit: true,
      onRestoreFailure: 'stayLoggedOut',
    }),
  ],
});
```

Bootstrap restore reads stored tokens, attempts `/auth/me`, and lets the existing auth interceptor refresh expired access tokens when possible. While that happens:

- `store.restoring()` is `true`
- `store.initialized()` stays `false`

After the first restore attempt completes or is skipped:

- `store.initialized()` becomes `true`
- `store.rbac()` and `store.ability()` are hydrated when the session is valid

Use `initialized()` to avoid protected-route flicker during app startup.

## Authorization State Notes

`AuthStore` is the Angular trust boundary for hydrated auth session state:

- raw `rbac` rules are stored alongside the derived CASL ability
- `/auth/me` authorization payloads are validated before the store trusts them
- malformed RBAC during restore, login, or refresh fails closed by clearing the session instead of keeping partial authorization state

Use `store.rbac()` for coarse route-attempt checks and `store.ability()` for concrete resource checks.
