# @anarchitects/auth-angular/feature

Feature layer for the Angular auth brick. It currently ships route guards that bridge the state layer with CASL abilities so Angular routers can enforce policy metadata.

## Exports

- `policyGuard`: standalone `CanMatchFn` that denies routes unless the logged-in ability can perform the configured action on the configured subject.

## Usage

```ts
import { Routes } from '@angular/router';
import { policyGuard } from '@anarchitects/auth-angular/feature';

export const routes: Routes = [
  {
    path: 'admin',
    canMatch: [policyGuard],
    data: { action: 'manage', subject: 'admin-section' },
    loadComponent: () =>
      import('./admin.component').then((m) => m.AdminComponent),
  },
];
```

The guard reads the `AuthStore` ability snapshot. Ensure the state layer is providing abilities by wiring the data-access and util modules in your application bootstrap.
