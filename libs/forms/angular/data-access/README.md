# @anarchitects/forms-angular/data-access

HTTP adapters for `@anarchitects/forms-angular`. Import the `FormsApi` service from this secondary
entry point to fetch form definitions, submit responses, and read stored submissions against the
generated REST API.

## Submission reads

Inject `FormsApi` from `@anarchitects/forms-angular/data-access` in an Angular injection context:

```ts
import { inject } from '@angular/core';
import { FormsApi } from '@anarchitects/forms-angular/data-access';

const api = inject(FormsApi);
const allSubmissions$ = api.getSubmissions();
const formSubmissions$ = api.getSubmissions({ formId: 'contact' });
const versionSubmissions$ = api.getSubmissions({ formId: 'contact', formVersion: 2 });
const submission$ = api.getSubmission('01900000-0000-7000-8000-000000000001');
```

`getSubmissions(filters?: SubmissionsQueryDTO)` returns `Observable<SubmissionsResponseDTO>`.
Both `formId` and `formVersion` are optional; only supplied values become query parameters.
The backend expects a nonempty form ID and a positive integer version. No matches return `[]`.

`getSubmission(submissionId: string)` returns `Observable<SubmissionResponseDTO>` and expects
a UUID. HTTP errors, including 404 for an unknown ID, propagate to the subscriber.
These shared DTO types are exported from `@anarchitects/forms-ts/dtos`; response dates remain
ISO strings. Use `fromSubmissionResponseDTO` from `@anarchitects/forms-ts/mappers` when a
domain model with `Date` values is needed.

Reads use the configured API base URL and resource path (by default `/api/forms`). They require
the submissions read endpoints introduced in #278. Host applications supply authorization
and any state or feature orchestration. For the supported higher-level path, see
[`FormsStore` read orchestration](../state/README.md#submission-reads-and-selection) and the
[`AnarchitectsFeatureSubmissionsAdmin` composition](../feature/README.md#shared-masterdetail-page).

## License

Released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
