# @anarchitects/forms-angular/feature

Feature-level orchestration for the forms Angular stack. Import components such as
`AnarchitectsFeatureForm`, `AnarchitectsFeatureSubmissionList`, and
`AnarchitectsFeatureSubmissionDetail` from this entry point to combine the signal store,
data access, and UI layers. Submission list/detail components consume state provided by the host;
`AnarchitectsFeatureForm` provides its own component-local state.

These components remain layout-compatible and forward canonical template/slot hooks to
the underlying UI layer.

## Submission state registration

`AnarchitectsFeatureSubmissionList` and `AnarchitectsFeatureSubmissionDetail` require
`FormsStore` from an enclosing injector. The recommended helper for shared submissions/admin
composition is `provideFormsSubmissionsFeature()` from this entry point.

Place both components under the same provider scope to share submissions state. Separate
host scopes receive separate stores. This `Provider[]` helper composes `provideFormsState()`;
it does not register global state, configure HTTP/API settings, or load submissions.
Direct `...provideFormsState()` from `@anarchitects/forms-angular/state` remains supported
as the low-level registration path. Choose one helper for the scope you are configuring.
See the [state registration examples](../state/README.md#explicit-state-registration) for
app and route configuration, including HTTP and forms configuration dependencies.

### Shared master/detail page

This host connects the list's `selected` output to the detail's `submissionId` input.
It deliberately has no state provider: choose one of the enclosing scopes below.

```ts
// submissions-page.ts
import { Component, signal } from '@angular/core';
import { AnarchitectsFeatureSubmissionDetail, AnarchitectsFeatureSubmissionList } from '@anarchitects/forms-angular/feature';

@Component({
  selector: 'app-submissions-page',
  imports: [AnarchitectsFeatureSubmissionList, AnarchitectsFeatureSubmissionDetail],
  template: `
    <anarchitects-forms-feature-submission-list (selected)="selectedId.set($event.id)" />
    <anarchitects-forms-feature-submission-detail [submissionId]="selectedId()" />
  `,
})
export class SubmissionsPage {
  readonly selectedId = signal<string | null>(null);
}
```

The page displays submissions already in the shared `FormsStore`. Provider registration
does not fetch saved submissions or add read-side APIs. With no selected ID, detail shows
the first stored submission; an empty store shows the existing empty states. A selected
ID absent from the store resolves to no detail. Host-side orchestration that populates state
must use the same injector scope as the components.

### Route-level registration

Register the recommended helper on the route containing the page. HTTP and forms
configuration should already be available from app bootstrap, as shown in the
[package quick start](../README.md#quick-start).

```ts
// app.routes.ts
import { Routes } from '@angular/router';
import { provideFormsSubmissionsFeature } from '@anarchitects/forms-angular/feature';
import { SubmissionsPage } from './submissions-page';

export const routes: Routes = [
  {
    path: 'submissions',
    providers: [...provideFormsSubmissionsFeature()],
    component: SubmissionsPage,
  },
];
```

Both components inherit one store from this route. If list and detail live on child routes,
put the provider on their common parent route. Route guards and audience-specific layouts
remain host concerns; the helper is the same for public, authenticated, or admin composition.

Direct low-level registration is equally supported. As an alternative to the route above:

```ts
import { Routes } from '@angular/router';
import { provideFormsState } from '@anarchitects/forms-angular/state';
import { SubmissionsPage } from './submissions-page';

export const routes: Routes = [
  {
    path: 'submissions',
    providers: [...provideFormsState()],
    component: SubmissionsPage,
  },
];
```

### Feature-level registration

For a reusable feature subtree that owns its state, put the recommended helper on a host
component instead of the route. Each host instance below gets an independent store shared
by its nested list and detail. Mount `SubmissionsFeature` on a route or inside another page.

```ts
// submissions-feature.ts
import { Component } from '@angular/core';
import { provideFormsSubmissionsFeature } from '@anarchitects/forms-angular/feature';
import { SubmissionsPage } from './submissions-page';

@Component({
  selector: 'app-submissions-feature',
  imports: [SubmissionsPage],
  providers: [...provideFormsSubmissionsFeature()],
  template: '<app-submissions-page />',
})
export class SubmissionsFeature {}
```

Choose route-level or feature-level ownership for a given master/detail pair. Providing
state again on a descendant creates a new store that shadows the ancestor. In particular,
do not provide a separate store around each component when they should share state.
For deliberate app-wide sharing, either helper can instead be spread into app providers;
state becomes app-wide only because the consuming app explicitly chose that scope.

## Migration from self-providing submission components

This is a breaking registration change for consumers of `AnarchitectsFeatureSubmissionList`
and `AnarchitectsFeatureSubmissionDetail`: importing or rendering them no longer creates a
`FormsStore`. Without an enclosing provider, Angular reports a missing store provider.

1. Choose the scope that owns the submissions state: an app, a common route, or a feature host.
2. Add `...provideFormsSubmissionsFeature()` there, or use `...provideFormsState()` directly.
3. Place list/detail and their state-populating orchestration under that same scope. Remove
   redundant descendant registrations if they should share the ancestor's store.
4. To preserve independent instances, give each feature subtree its own host provider.
5. In component tests, provide state in TestBed or a host component. Do not override submission
   component providers to recreate the removed self-provisioning behavior.

Keep HTTP and API configuration at the app level as before. No global store is registered
automatically, and neither helper replaces those infrastructure providers.

`AnarchitectsFeatureForm` is outside this scope change and retains its component-local store.
Its store shadows any enclosing store, so placing it beside submission list/detail does not
make its submissions flow into their shared store. Its existing quick start remains valid.

## License

Released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
