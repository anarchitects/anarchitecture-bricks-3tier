# @anarchitects/forms-angular/state

Signal store utilities for `@anarchitects/forms-angular`. Import `FormsStore` from this entry point
to orchestrate form definition loading, submission reads and writes, and reactive state exposure.

## Submission reads and selection

Inject the explicitly provided store in a host component or another Angular injection context:

```ts
import { inject } from '@angular/core';
import { FormsStore } from '@anarchitects/forms-angular/state';

const store = inject(FormsStore);
store.loadSubmissions(); // List all submissions.
store.loadSubmissions({ formId: 'contact', formVersion: 2 }); // Both filters are optional.
store.loadSubmission('01900000-0000-7000-8000-000000000001'); // Fetch and select a detail.
store.selectSubmission('01900000-0000-7000-8000-000000000001'); // Select cached data without fetching.
store.selectSubmission(null); // Clear selection and cancel any pending detail request.
```

| Public state                                      | Meaning                                                                    |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| `submissionsEntities()`                           | Canonical cache shared by list reads, detail reads, and submission writes. |
| `loadedSubmissions()`                             | Entries in the latest successful list response, in response order.         |
| `submissionsLoading()` / `submissionsError()`     | List request status and error message.                                     |
| `selectedSubmissionId()` / `selectedSubmission()` | Selected ID and its cached entity, or `null` when absent.                  |
| `submissionLoading()` / `submissionError()`       | Detail request status and error message.                                   |

`loadSubmissions(filters?: SubmissionsQueryDTO)` forwards filters to `FormsApi`. Successful
reads merge or replace entities by ID in the canonical cache. They replace the latest list
membership, including with an empty list, without removing cached or locally submitted entries.
Use `loadedSubmissions()` for the current server-filtered list; `submissionsEntities()` includes
all known submissions. Detail reads and writes update cached entities without adding IDs to the
latest list result. Reload the list to refresh its membership after a write.

`loadSubmission(id)` selects the requested ID immediately, then fetches and updates its entity.
A cached detail remains available during refresh; an uncached or unknown ID resolves to `null`.
List reads do not change selection. `selectSubmission(id)` cancels a pending detail request and
selects without fetching; passing `null` clears selection. `loadSubmission(null)` also clears
selection and cancels the detail request.

Each read starts with a cleared error, exposes loading until completion, and cancels the previous
request of the same kind. Failures retain cached data and the last successful list result and
expose an error string; another load retries normally. Explicit selection clears the detail error.
List and detail statuses are independent of one another and of the existing `loading`, `error`,
and `submitted` signals used by definition lookup and submission writes. Read responses use the
shared mapper so cached `createdAt` and `updatedAt` values are `Date` objects.

## Explicit state registration

`FormsStore` is not automatically provided at root. `provideFormsState(): Provider[]` is the
canonical low-level registration helper. Spread its providers into the injector scope that
should own the state. Consumers in that scope share one store; registering the helper in
another scope creates a separate instance.

The helper registers only state. Supply HTTP and forms configuration separately for `FormsApi`.

For shared submission list/detail composition, the recommended high-level helper is
`provideFormsSubmissionsFeature()` from `@anarchitects/forms-angular/feature`. It delegates
to `provideFormsState()` and returns the same provider-array contract. Direct registration
here remains supported for custom composition; choose one helper per intended scope.
See the [feature guide](../feature/README.md) for shared master/detail examples.

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
`AnarchitectsFeatureForm` still provides its own local state, which shadows an enclosing
store. This form component is not part of the submission-feature scoping migration.
Registering a provider does not fetch saved submissions. Call the read methods explicitly;
existing submission feature components reflect entities present in their shared store.

Consumers upgrading from self-providing submission components must now add either helper
to an enclosing scope. Follow the [submission migration steps](../feature/README.md#migration-from-self-providing-submission-components)
to choose shared or isolated state deliberately.

### Return-shape migration

The helper now returns `[FormsStore]` instead of the store class directly. Prefer
`providers: [...provideFormsState()]`. Existing `providers: [provideFormsState()]` registration
continues to work because Angular accepts nested provider arrays. Code that treats the return
value as the store class must use the exported `FormsStore` token instead.

## License

Released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
