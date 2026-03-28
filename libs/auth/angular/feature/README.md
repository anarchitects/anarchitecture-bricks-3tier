# @anarchitects/auth-angular/feature

Feature-level orchestration for Angular auth. It ships route guards plus standalone feature components that orchestrate auth actions via state-layer entrypoints and delegate rendering to `@anarchitects/auth-angular/ui`.

JWT-specific feature components live under `@anarchitects/auth-angular/feature/jwt`, not the root feature entry point. They should orchestrate through `@anarchitects/auth-angular/state/jwt`, never `data-access/jwt` directly.

## Exports

- `policyGuard`: standalone coarse `CanMatchFn` for route-attempt checks.
- `resourcePolicyGuard`: standalone `CanActivateFn` for resolved-resource authorization checks.
- `AnarchitectsFeatureRegister`
- `AnarchitectsFeatureLogin`
- `AnarchitectsFeatureActivateUser`
- `AnarchitectsFeatureForgotPassword`
- `AnarchitectsFeatureResetPassword`
- `AnarchitectsFeatureVerifyEmail`
- `AnarchitectsFeatureChangePassword`
- `AnarchitectsFeatureUpdateEmail`
- `AnarchitectsFeatureLogout`

## Usage

```ts
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

`policyGuard` reads the hydrated RBAC rules and applies the shared coarse route matcher from `@anarchitects/auth-ts`. It intentionally does not decide ownership-sensitive access by itself.

Use `resourcePolicyGuard` when the route already has the concrete entity in `route.data`. It evaluates the hydrated CASL ability against that loaded resource and redirects away when access is denied.

This means a typical ownership-sensitive flow looks like this:

- `policyGuard` allows the route attempt for `{ action, subject }`
- `resourcePolicyGuard` checks the resolved entity when the route already has it
- UI elements such as edit buttons still use `canAccessResource(...)` or `canAccessResourceField(...)`
- the backend remains responsible for the final instance-level authorization decision

Do not treat `policyGuard` as a full `PolicyRule` mirror. It is intentionally coarse.

Ensure the state layer is explicitly provided in your app/route providers by wiring `...provideAuthState()` from `@anarchitects/auth-angular/state`.

JWT plugin feature flows should likewise register `...provideAuthJwtState()` from `@anarchitects/auth-angular/state/jwt` when the route/page mounts JWT-specific components.

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
import { AnarchitectsFeatureLogout } from '@anarchitects/auth-angular/feature';

@Component({
  selector: 'app-session-page',
  imports: [AnarchitectsFeatureLogout],
  template: `
    <anarchitects-auth-feature-logout />
  `,
})
export class SessionPageComponent {
  userId = 'current-user-id';
}
```
