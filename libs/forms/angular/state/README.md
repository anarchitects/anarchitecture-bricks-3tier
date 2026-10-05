# @anarchitects/forms-angular/state

Signal store utilities for `@anarchitects/forms-angular`. Import `FormsStore` from this entry point
to orchestrate form definition loading, submission lifecycles, and reactive state exposure.

## Explicit state registration

`FormsStore` is not automatically provided at root. `provideFormsState(): Provider[]` is the
canonical low-level registration helper. Spread its providers into the injector scope that
should own the state. Consumers in that scope share one store; registering the helper in
another scope creates a separate instance.

The helper registers only state. Supply HTTP and forms configuration separately for `FormsApi`.

### App-wide state

```ts
import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideFormsDefaults } from '@anarchitects/forms-angular/config';
import { provideFormsState } from '@anarchitects/forms-angular/state';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(), ...provideFormsDefaults(), ...provideFormsState()],
};
```

### Route-scoped state

For state shared by a route and its descendants, register the helper on their common parent
route. In this example, HTTP and forms configuration are already registered at app bootstrap.
`FormsPage` is a host-owned component that injects `FormsStore` without providing it again.

```ts
import { Routes } from '@angular/router';
import { provideFormsState } from '@anarchitects/forms-angular/state';
import { FormsPage } from './forms.page';

export const routes: Routes = [
  {
    path: 'forms',
    providers: [...provideFormsState()],
    children: [{ path: '', component: FormsPage }],
  },
];
```

The helper also composes inside other `Provider[]` helpers and component `providers` arrays.
A descendant that provides its own `FormsStore` uses that local instance instead of the parent
store. Submission list/detail feature components consume the enclosing store scope.
`AnarchitectsFeatureForm` still provides its own local state.

### Return-shape migration

The helper now returns `[FormsStore]` instead of the store class directly. Prefer
`providers: [...provideFormsState()]`. Existing `providers: [provideFormsState()]` registration
continues to work because Angular accepts nested provider arrays. Code that treats the return
value as the store class must use the exported `FormsStore` token instead.

## License

Released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
