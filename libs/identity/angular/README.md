# @anarchitects/identity-angular

Angular profile data access, explicitly scoped signal state, and reusable profile UI for the Anarchitecture identity domain.

## Developer + AI Agent Start Here

- Use the root package for routine setup and the secondary entry points for targeted composition.
- Keep state explicitly provided through helper functions; do not add `providedIn: 'root'` stores.
- Avoid deep imports from internal source files.

## Features

- Root barrel for `config`, `data-access`, `feature`, `state`, and `ui`
- Typed profile HTTP operations backed by `@anarchitects/identity-ts`
- Explicit provider helpers for config, data-access, and state composition
- Signal-based loading, saving, error, and current-profile state
- Standalone profile view and Signal Forms editor components
- Feature-level profile composition for loading and updating the current user profile

## Installation

```bash
npm install @anarchitects/identity-angular
# or
yarn add @anarchitects/identity-angular
# or
pnpm add @anarchitects/identity-angular
```

## Entry points

| Import path                                  | Description                                     |
| -------------------------------------------- | ----------------------------------------------- |
| `@anarchitects/identity-angular`             | Root barrel for routine app wiring              |
| `@anarchitects/identity-angular/config`      | Config tokens and provider helpers              |
| `@anarchitects/identity-angular/data-access` | Typed `IdentityApi` and data-access providers   |
| `@anarchitects/identity-angular/feature`     | Feature providers and `UserProfileFeature`      |
| `@anarchitects/identity-angular/state`       | Explicitly provided `IdentityStore`             |
| `@anarchitects/identity-angular/ui`          | Profile view and Signal Forms editor components |

## Easy mode

Configure Angular HTTP once at the application root, compose the identity providers, and render the feature with the authenticated user id:

```ts
import { provideHttpClient } from '@angular/common/http';
import { provideIdentityFeature } from '@anarchitects/identity-angular';

export const appConfig = {
  providers: [
    provideHttpClient(),
    ...provideIdentityFeature({
      apiResourcePath: 'identity',
    }),
  ],
};
```

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UserProfileFeature } from '@anarchitects/identity-angular';

@Component({
  selector: 'app-profile-page',
  imports: [UserProfileFeature],
  template: `<anarchitects-user-profile [authUserId]="authUserId" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  readonly authUserId = 'authenticated-user-id';
}
```

The default API route is `/api/identity/profiles`. Set `apiBaseUrl` when the API is hosted on another origin.

## Advanced composition

Applications can compose the layers independently and provide state at application, route, or component scope:

```ts
import { provideIdentityConfig } from '@anarchitects/identity-angular/config';
import { provideIdentityDataAccess } from '@anarchitects/identity-angular/data-access';
import { provideIdentityState } from '@anarchitects/identity-angular/state';

export const profileRoute = {
  path: 'profile',
  providers: [...provideIdentityConfig({ apiBaseUrl: 'https://api.example.com' }), ...provideIdentityDataAccess(), ...provideIdentityState()],
  loadComponent: () => import('@anarchitects/identity-angular/feature').then(({ UserProfileFeature }) => UserProfileFeature),
};
```

For custom orchestration, inject `IdentityStore` and use `loadProfile(authUserId)` and `updateProfile(dto)`. The store exposes readonly `profile`, `loading`, `saving`, `error`, and `hasProfile` signals.

The editor keeps non-null string values internally and maps blank values back to the nullable fields defined by `UpdateUserProfileRequestDTO` at submission time.

## Scripts

- `yarn nx run identity-angular:build`
- `yarn nx run identity-angular:test`
- `yarn nx run identity-angular:lint`

## Development notes

- Configure `HttpClient` once in the consuming application; identity data access does not own the shared transport setup.
- `IdentityStore` has no `providedIn: 'root'`; scope it explicitly with `provideIdentityState()` or `provideIdentityFeature()`.
- The package does not depend on the legacy Common Angular UI packages.
- Extend public secondary entry points instead of adding internal-path imports.

## Contributing

Preserve the `ui <- feature -> state -> data-access` layering and keep configuration shared through public provider helpers.

## License

Licensed under the Apache License, Version 2.0.
