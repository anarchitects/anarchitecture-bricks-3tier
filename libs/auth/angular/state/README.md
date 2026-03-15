# @anarchitects/auth-angular/state

Signal-based state management for the auth domain. Import from `@anarchitects/auth-angular/state` to orchestrate login, logout, password resets, token refresh, and related workflows without wiring up NgRx reducers manually.

## Exports

- `AuthStore`: an Angular `signalStore` that exposes:
  - computed selectors (`isLoggedIn`, `loggedInUser`)
  - async methods for each auth use case (`login`, `logout`, `registerUser`, etc.)
- `provideAuthState`: provider helper for explicit store registration (app/route scope)
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
