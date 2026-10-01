# @anarchitects/auth-angular/state

Signal-based state management for the auth domain. Import from `@anarchitects/auth-angular/state` to orchestrate the session-first core auth flows without wiring up NgRx reducers manually. JWT plugin state lives under `@anarchitects/auth-angular/state/jwt`.

## Exports

- `AuthStore`: an Angular `signalStore` that exposes:
  - computed selectors (`isLoggedIn`, `loggedInUser`)
  - bootstrap status (`initialized`, `restoring`)
  - hydrated authorization state (`rbac`, `ability`)
  - reactive `rxMethod` triggers for auth use cases (`login`, `logout`, `registerUser`, etc.)
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

Bootstrap restore attempts `/auth/me` against the active Better Auth session and leaves JWT refresh behavior to the optional JWT plugin state layer. While that happens:

- `store.restoring()` is `true`
- `store.initialized()` stays `false`

After the first restore attempt completes or is skipped:

- `store.initialized()` becomes `true`
- `store.rbac()` and `store.ability()` are hydrated when the session is valid

Use `initialized()` to avoid protected-route flicker during app startup.

## Reactive login and redirects

`store.login(dto)` starts login and returns an NgRx `RxMethodRef` handle, not a
completion promise. **Do not await it or immediately inspect `isLoggedIn()` to
decide whether that request succeeded.** Observe the store's signals instead.
Request and payload-validation errors are exposed through `error()`; they do not
reject a promise or propagate to a `try/catch` around the trigger.

The existing reactive API remains supported, including signal/observable inputs
and NgRx's `destroy()` handles. Follow NgRx's lifecycle semantics: a static DTO
call's handle does not cancel its HTTP request. A newer login supersedes the prior
request, and destroying the store scope tears down its reactive methods.

For a login page, keep redirects in the host component. This recipe waits for
bootstrap restoration, tracks an explicit submission, and consumes that attempt
once it settles. A restored session alone does not redirect, and a failed attempt
does not redirect even if an older session remains present.

```ts
import { Component, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { AnarchitectsAuthUiLoginForm } from '@anarchitects/auth-angular/ui';
import { LoginRequestDTO } from '@anarchitects/auth-ts/dtos';

@Component({
  selector: 'app-login-page',
  imports: [AnarchitectsAuthUiLoginForm],
  template: `
    @if (store.initialized() && !store.restoring()) {
      <anarchitects-auth-ui-login-form (submitted)="onLogin($event)" />
    }
    @if (store.loading()) {
      <p role="status">Signing in…</p>
    }
    @if (store.error()) {
      <p role="alert">{{ store.error() }}</p>
    }
  `,
})
export class LoginPage {
  readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly loginPending = signal(false);

  constructor() {
    effect(() => {
      if (!this.loginPending() || this.store.loading() || this.store.restoring()) {
        return;
      }

      const authenticated = this.store.success() && this.store.error() === null && this.store.isLoggedIn();
      untracked(() => {
        this.loginPending.set(false);
        if (authenticated) {
          void this.router.navigateByUrl('/admin/dashboard');
        }
      });
    });
  }

  onLogin(dto: LoginRequestDTO): void {
    if (!this.store.initialized() || this.store.restoring() || this.store.loading() || this.loginPending()) {
      return;
    }

    this.loginPending.set(true);
    this.store.login(dto);
  }
}
```

Provide the store explicitly in the surrounding route or app scope, shared with
the consumers that need the authenticated state. Angular destroys the component's
effect when the page is destroyed. The page ignores additional submissions while
one is pending, including synchronous responses before the effect runs.

This recipe assumes the login page owns auth commands while its attempt is pending:
`loading`, `success`, and `error` are shared across the store's operations. Do not
run unrelated auth commands concurrently and treat those flags as per-request
results. The store itself does not choose a redirect destination.

The built-in login feature's `submitForm` handler now returns `void`, reflecting
that it triggers login. Callers chaining its former promise must move completion
handling to the signals as above; that promise never represented HTTP completion.

## Authorization State Notes

`AuthStore` is the Angular trust boundary for hydrated auth session state:

- raw `rbac` rules are stored alongside the derived CASL ability
- `/auth/me` authorization payloads are validated before the store trusts them
- malformed RBAC during restore, login, or refresh fails closed by clearing the session instead of keeping partial authorization state

Use `store.rbac()` for coarse route-attempt checks and `store.ability()` for concrete resource checks.
