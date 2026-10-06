# @anarchitects/forms-angular/feature

Feature-level orchestration for the forms Angular stack. Import components such as
`AnarchitectsFeatureForm`, `AnarchitectsFeatureSubmissionsAdmin`,
`AnarchitectsFeatureSubmissionList`, and `AnarchitectsFeatureSubmissionDetail` from this entry point to combine the signal store,
data access, and UI layers. Submission list/detail components consume state provided by the host;
`AnarchitectsFeatureForm` provides its own component-local state.

The standalone form/list/detail features forward canonical template/slot hooks to the UI layer.
The admin composition exposes list/detail titles, layouts, and layout options; use the standalone
features or UI components when custom projection is needed.

## Submission state registration

`AnarchitectsFeatureSubmissionsAdmin`, `AnarchitectsFeatureSubmissionList`, and
`AnarchitectsFeatureSubmissionDetail` require
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

`AnarchitectsFeatureSubmissionsAdmin` is the ready-made read-side composition. It loads the
submission list on initialization and when `formId` or `formVersion` changes, then fetches a
selected submission's detail. Both panes reuse the existing UI components and one enclosing
`FormsStore`. This page deliberately has no provider: choose a route or feature scope below.

```ts
// submissions-page.ts
import { Component } from '@angular/core';
import { AnarchitectsFeatureSubmissionsAdmin } from '@anarchitects/forms-angular/feature';

@Component({
  selector: 'app-submissions-page',
  imports: [AnarchitectsFeatureSubmissionsAdmin],
  template: `<anarchitects-forms-feature-submissions-admin />`,
})
export class SubmissionsPage {}
```

For one form/version, use:

```html
<anarchitects-forms-feature-submissions-admin formId="contact" [formVersion]="2" />
```

| API                                        | Behavior                                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `formId`, `formVersion`                    | Optional server-side list filters. Omit both for all submissions; each change reloads the list.                  |
| `submissionId`                             | Optional detail ID, for example from host routing. A changed ID fetches and selects it; `null` clears selection. |
| `selected`                                 | Emits the clicked list entity while fresh detail loads. The shared store receives the fetched detail.            |
| `listTitle`, `detailTitle`                 | Pane titles; defaults are “Submissions” and “Submission details”.                                                |
| `listLayout`, `detailLayout`               | Existing `FormsLayoutId` values forwarded to the UI components.                                                  |
| `listLayoutOptions`, `detailLayoutOptions` | Existing UI layout option objects.                                                                               |
| `reload()`                                 | Refreshes the current list; also available through the Refresh submissions button.                               |

The component displays independent loading/error status and retry actions for each pane.
No row is selected automatically. Existing cached selection remains visible during refresh;
changing list filters preserves selection, even when that entry is outside the new list.
The list displays `loadedSubmissions()`, so previously cached or locally submitted entries do not
leak into a filtered result. A successful empty response shows the existing empty-list UI.
Explicit `submissionId` changes control detail loading; row clicks update the shared store and
emit `selected` without changing the input. A host may use the output to update its URL.

### Read pipeline and dependencies

The admin feature calls public `FormsStore` read methods, which use `FormsApi` and the shared
submission DTOs to call `GET /forms/submissions` and `GET /forms/submissions/:submissionId`
under the configured API base URL. The store converts DTO dates to `Date` objects and merges
entities into the canonical cache before the existing UI list/detail components render them.
There are no app-local API services or audience-specific packages in this flow.

This composition depends on the explicit shared-scoping contract from #275 (provider helpers
and submission components that consume the enclosing store), plus backend contracts/endpoints
from #278, data-access reads from #279, and state orchestration from #280. Provider registration
itself does not fetch anything; rendering the admin component initiates reads. Keep one active
admin composition per store scope because each store owns one list result and one selection.
Host applications own route guards and backend authorization for submission payloads.

For custom orchestration, use the public [data-access](../data-access/README.md),
[state](../state/README.md#submission-reads-and-selection), and [UI](../ui/README.md) entry points.
The existing `AnarchitectsFeatureSubmissionList` and `AnarchitectsFeatureSubmissionDetail`
remain cache-only building blocks: they do not initiate reads. The standalone list displays the
canonical cache with optional local `formId` filtering, and the standalone detail defaults to
the first cached submission when no ID is supplied. Use the new admin composition for the
server-filtered list and explicit shared selection described above.

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
