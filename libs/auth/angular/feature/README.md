# @anarchitects/auth-angular/feature

Feature-level orchestration for Angular auth. It ships route guards plus standalone feature components that orchestrate auth actions via `AuthStore` and delegate rendering to `@anarchitects/auth-angular/ui`.

## Exports

- `policyGuard`: standalone `CanMatchFn` that denies routes unless the logged-in ability can perform the configured action on the configured subject.
- `AnarchitectsFeatureRegister`
- `AnarchitectsFeatureLogin`
- `AnarchitectsFeatureActivateUser`
- `AnarchitectsFeatureForgotPassword`
- `AnarchitectsFeatureResetPassword`
- `AnarchitectsFeatureVerifyEmail`
- `AnarchitectsFeatureChangePassword`
- `AnarchitectsFeatureUpdateEmail`
- `AnarchitectsFeatureLogout`
- `AnarchitectsFeatureRefreshTokens`

## Usage

```ts
import { Routes } from '@angular/router';
import { policyGuard } from '@anarchitects/auth-angular/feature';

export const routes: Routes = [
  {
    path: 'admin',
    canMatch: [policyGuard],
    data: { action: 'manage', subject: 'admin-section' },
    loadComponent: () => import('./admin.component').then((m) => m.AdminComponent),
  },
];
```

The guard reads the `AuthStore` ability snapshot. Ensure the state layer is explicitly provided in your app/route providers by wiring `provideAuthState()` from `@anarchitects/auth-angular/state`.

### Token-driven actions

```ts
import { Component } from '@angular/core';
import { AnarchitectsFeatureVerifyEmail } from '@anarchitects/auth-angular/feature';

@Component({
  selector: 'app-verify-email-page',
  imports: [AnarchitectsFeatureVerifyEmail],
  template: `<anarchitects-auth-feature-verify-email [token]="token" />`,
})
export class VerifyEmailPageComponent {
  token = 'verification-token-from-route';
}
```

### User-id actions

```ts
import { Component } from '@angular/core';
import { AnarchitectsFeatureChangePassword } from '@anarchitects/auth-angular/feature';

@Component({
  selector: 'app-change-password-page',
  imports: [AnarchitectsFeatureChangePassword],
  template: `<anarchitects-auth-feature-change-password [userId]="userId" />`,
})
export class ChangePasswordPageComponent {
  userId = 'current-user-id';
}
```

### Token refresh/logout

```ts
import { Component } from '@angular/core';
import { AnarchitectsFeatureRefreshTokens, AnarchitectsFeatureLogout } from '@anarchitects/auth-angular/feature';

@Component({
  selector: 'app-session-page',
  imports: [AnarchitectsFeatureRefreshTokens, AnarchitectsFeatureLogout],
  template: `
    <anarchitects-auth-feature-refresh-tokens [userId]="userId" />
    <anarchitects-auth-feature-logout />
  `,
})
export class SessionPageComponent {
  userId = 'current-user-id';
}
```
