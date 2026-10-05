# @anarchitects/forms-angular/feature

Feature-level orchestration for the forms Angular stack. Import components such as
`AnarchitectsFeatureForm`, `AnarchitectsFeatureSubmissionList`, and
`AnarchitectsFeatureSubmissionDetail` from this entry point to combine the signal store,
data access, and UI layers into a drop-in experience.

These components remain layout-compatible and forward canonical template/slot hooks to
the underlying UI layer.

## Submission state registration

`AnarchitectsFeatureSubmissionList` and `AnarchitectsFeatureSubmissionDetail` require
`FormsStore` from an enclosing injector. The recommended helper for shared submissions/admin
composition is `provideFormsSubmissionsFeature()` from this entry point:

```ts
import { Provider } from '@angular/core';
import { provideFormsSubmissionsFeature } from '@anarchitects/forms-angular/feature';

// Use this array in app, route, or parent-component providers.
const providers: Provider[] = [...provideFormsSubmissionsFeature()];
```

Place both components under the same provider scope to share submissions state. Separate
host scopes receive separate stores. This `Provider[]` helper composes `provideFormsState()`;
it does not register global state, configure HTTP/API settings, or load submissions.
Direct `...provideFormsState()` from `@anarchitects/forms-angular/state` remains supported
as the low-level registration path. Choose one helper for the scope you are configuring.
See the [state registration examples](../state/README.md#explicit-state-registration) for
app and route configuration, including HTTP and forms configuration dependencies.

**Migration:** These submission components previously created their own store instances.
Consumers must now explicitly register state in an enclosing scope; without it, Angular
reports a missing `FormsStore` provider. Register state on separate parent components or
routes when independent instances are needed. No global store is registered automatically.

`AnarchitectsFeatureForm` retains its component-local store scope.

## License

Released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
