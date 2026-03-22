# @anarchitects/forms-angular

Angular domain UI components for consuming the Anarchitecture Forms platform. This package wires together
configuration, data-access, state, feature, and UI layers so Angular applications can request
contract-driven form definitions, render them dynamically, and submit responses.

## Developer + AI Agent Start Here

- Read this README before generating integration code for `@anarchitects/forms-angular`.
- Compose using public entry points only (`config`, `data-access`, `state`, `feature`, `ui`); do not import internal files.
- Respect Angular layering: `ui <- feature -> state -> data-access` with `config`/`util` shared.
- Register state and providers explicitly via helper functions in app/route providers.
- Keep contracts aligned with `@anarchitects/forms-ts`.

## Features

- Layered Angular integration for dynamic form retrieval, rendering, and submission
- Shared DTO/model contracts aligned with generated OpenAPI clients
- Composable secondary entry points for app-specific architecture choices

## Entry points

`@anarchitects/forms-angular` exposes several secondary entry points, each mapped to a specific
layer in the 3-tier architecture:

| Entry point                               | Purpose                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| `@anarchitects/forms-angular/config`      | Injection tokens and provider helpers for base API configuration.          |
| `@anarchitects/forms-angular/data-access` | HTTP adapters that call the generated forms REST API.                      |
| `@anarchitects/forms-angular/state`       | Signal store that orchestrates requests, caching, and submission state.    |
| `@anarchitects/forms-angular/feature`     | Feature components that combine state, UI, and orchestration.              |
| `@anarchitects/forms-angular/ui`          | Presentational form/list/detail components with layout/template contracts. |

Each layer can be consumed independently or as a combined stack, depending on what your app needs.

## Installation

```bash
npm install @anarchitects/forms-angular @angular/common @angular/core @angular/forms @ngrx/operators @ngrx/signals rxjs
```

Peer requirements:

- `@angular/common`, `@angular/core`, `@angular/forms`
- `@ngrx/operators`, `@ngrx/signals`, `rxjs`

The internal `@anarchitects/forms-ts` and common UI packages are installed transitively.

## Usage

### Quick start

```typescript
// app.config.ts
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideFormsDefaults } from '@anarchitects/forms-angular/config';

export const appConfig = {
  providers: [provideHttpClient(withFetch()), provideFormsDefaults()],
};
```

```typescript
// feature shell component
import { Component } from '@angular/core';
import { AnarchitectsFeatureForm } from '@anarchitects/forms-angular/feature';

@Component({
  selector: 'app-contact-form',
  imports: [AnarchitectsFeatureForm],
  template: `
    <anarchitects-forms-feature-form
      [formId]="'contact_default'"
      [formVersion]="1"
      (submitted)="onSubmitted()"
    />
  `,
})
export class ContactFormRoute {
  onSubmitted(): void {
    console.log('Form was sent');
  }
}
```

Behind the scenes the feature component uses the signal store to request the form definition, renders
it with the UI layer, and posts submissions via the data-access service.

## Working with individual layers

You can opt into specific slices of the stack:

- **Config** – call `provideFormsConfig({ apiResourcePath: 'forms' })` to override the default API
  resource segment.
- **Data-access** – inject `FormsApi` from the data-access entry point to integrate the OpenAPI client
  with custom facades or state.
- **State** – inject the `FormsStore` signal store to orchestrate requests and expose reactive signals
  for loading/error/submission status.
- **UI** – use `AnarchitectsUiForm`, `AnarchitectsFormsUiSubmissionList`, and
  `AnarchitectsFormsUiSubmissionDetail` directly if you manage orchestration elsewhere.

## Publishing

This package is published as public npm modules. Secondary entry points are shipped as tree-shakeable
ESM bundles so only the layers you import are included in your application bundle.

## Development notes

- Keep HTTP integration inside `data-access`; avoid direct endpoint calls in components.
- Keep orchestration in `feature/state`, and keep `ui` components presentational.
- Keep route and form contract alignment by regenerating OpenAPI when DTO/controller schemas evolve.

## License

Released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
