# @anarchitects/forms-angular

Angular domain UI components for consuming the Anarchitecture Forms platform. This package wires together
configuration, data-access, state, feature, and UI layers so Angular applications can request
contract-driven form definitions, render them dynamically, submit responses, and inspect saved submissions.

Applications moving from the Reactive Forms and Common Angular UI line should follow the
[Angular 22, Signal Forms, and Tailwind v4 migration guide](../../../docs/guides/angular-22-signal-forms-tailwind-migration.md).

## Developer + AI Agent Start Here

- Read this README before generating integration code for `@anarchitects/forms-angular`.
- Compose using public entry points only (`config`, `data-access`, `state`, `feature`, `ui`); do not import internal files.
- Respect Angular layering: `ui <- feature -> state -> data-access` with `config`/`util` shared.
- Register state and providers explicitly via helper functions in app/route providers.
- Keep contracts aligned with `@anarchitects/forms-ts`.

## Features

- Layered Angular integration for dynamic form retrieval, rendering, and submission
- Submission list/detail reads with filters, shared selection, and a ready-made admin composition
- Shared DTO/model contracts aligned with generated OpenAPI clients
- Composable secondary entry points for app-specific architecture choices
- Angular 22 Signal Forms with contract-driven validation and host schema extensions
- Forms-owned layout and projection contracts styled by `@anarchitects/tailwind`

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
npm install @anarchitects/forms-angular @anarchitects/tailwind @angular/common @angular/core @angular/forms @ngrx/operators @ngrx/signals rxjs
```

Peer requirements:

- Angular 22: `@angular/common`, `@angular/core`, and `@angular/forms`
- NgRx 22: `@ngrx/operators` and `@ngrx/signals`
- `@anarchitects/tailwind ^0.0.1` and RxJS 7.8

Import the Tailwind foundation and tell Tailwind where your application and the
published forms templates live:

```css
/* styles.css */
@import '@anarchitects/tailwind';

@source './app';
@source '../node_modules/@anarchitects/forms-angular';
```

The internal `@anarchitects/forms-ts` contract package is installed transitively.

## Usage

### Quick start

```typescript
// app.config.ts
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideFormsDefaults } from '@anarchitects/forms-angular/config';

export const appConfig = {
  providers: [provideHttpClient(withFetch()), ...provideFormsDefaults()],
};
```

```typescript
// feature shell component
import { Component } from '@angular/core';
import { AnarchitectsFeatureForm } from '@anarchitects/forms-angular/feature';

@Component({
  selector: 'app-contact-form',
  imports: [AnarchitectsFeatureForm],
  template: ` <anarchitects-forms-feature-form [formId]="'contact_default'" [formVersion]="1" (submitted)="onSubmitted()" /> `,
})
export class ContactFormRoute {
  onSubmitted(): void {
    console.log('Form was sent');
  }
}
```

Behind the scenes the feature component uses the signal store to request the form definition, renders
it with the UI layer, and posts submissions via the data-access service.

This quick start uses `AnarchitectsFeatureForm`, which retains its component-local store.
Submission list/detail components require the explicit enclosing scope described below.

### Submissions admin/master-detail

With HTTP and API configuration from the quick start, register a shared store on a host:

```ts
import { Component } from '@angular/core';
import { AnarchitectsFeatureSubmissionsAdmin, provideFormsSubmissionsFeature } from '@anarchitects/forms-angular/feature';

@Component({
  selector: 'app-submissions-page',
  imports: [AnarchitectsFeatureSubmissionsAdmin],
  providers: [...provideFormsSubmissionsFeature()],
  template: `<anarchitects-forms-feature-submissions-admin formId="contact" [formVersion]="2" />`,
})
export class SubmissionsPage {}
```

Omit both filters to list all submissions. The component loads on initialization and filter
changes, fetches detail when a row is selected, and provides loading/error/retry states. It reuses
the existing UI list/detail components. Supply `submissionId` for a host-controlled detail ID.
A route provider may own the store instead; choose one shared scope, following #275.

The public read path is `feature → state → data-access → backend`, with `feature → ui` for
rendering. `FormsApi.getSubmissions()` / `getSubmission()` return shared DTOs; `FormsStore`
handles loading, date conversion, caching, and selection. The backend must support the #278
submission read endpoints. Authorization remains the host's responsibility.

See the [feature consumer guide](feature/README.md#shared-masterdetail-page) for all inputs,
selection behavior, route-level setup, and custom composition. See the
[data-access guide](data-access/README.md#submission-reads) and
[state guide](state/README.md#submission-reads-and-selection) to consume the lower layers directly.

### Shared submission list/detail state

`AnarchitectsFeatureSubmissionsAdmin`, `AnarchitectsFeatureSubmissionList`, and
`AnarchitectsFeatureSubmissionDetail` consume an
enclosing `FormsStore`; importing these components does not register state. Choose one of
these supported provider helpers and spread it into app, route, or feature-host providers:

| Registration                          | Import                                | Use                                                           |
| ------------------------------------- | ------------------------------------- | ------------------------------------------------------------- |
| `...provideFormsSubmissionsFeature()` | `@anarchitects/forms-angular/feature` | Recommended for shared submissions/master-detail composition. |
| `...provideFormsState()`              | `@anarchitects/forms-angular/state`   | Low-level explicit registration for custom state composition. |

Both helpers return `Provider[]`; the feature helper composes the state helper. Put list,
detail, and the orchestration that populates state under the same provider scope to share
one store. Separate host scopes get independent stores. Registering another store in a
descendant shadows the parent store. Neither helper registers a global singleton or fetches
saved submissions, and HTTP/API configuration remains an app responsibility.

See the feature guide for a [shared master/detail page](feature/README.md#shared-masterdetail-page),
[route-level registration](feature/README.md#route-level-registration), and
[feature-level registration](feature/README.md#feature-level-registration).

**Migration:** Submission list/detail previously self-provided isolated stores. Consumers
must now register one of the helpers in an enclosing scope, or Angular reports a missing
store provider. See the [migration steps](feature/README.md#migration-from-self-providing-submission-components).
`AnarchitectsFeatureForm` is unchanged: it still owns a local store and does not automatically
share state with an enclosing submissions feature.

### Extending validation

`FormConfig.validationRules` remains the portable contract surface. For host-only
rules, pass Signal Forms schema functions through `schemaExtensions`; the feature
facade forwards them to the UI component.

```typescript
import { validate } from '@angular/forms/signals';
import type { FormsSchemaExtension } from '@anarchitects/forms-angular/ui';

export const companyEmail: FormsSchemaExtension = (path) => {
  validate(path['email'], ({ value }) => (value().endsWith('@example.com') ? undefined : { kind: 'companyEmail', message: 'Use your company email.' }));
};
```

```html
<anarchitects-forms-feature-form formId="contact_default" [schemaExtensions]="[companyEmail]" />
```

### Batteries-Included Contact Form

The primary forms-page flow is designed to work with near-zero custom CSS. Use `pagePreset` for
layout/spacing/width defaults and header inputs for standalone page rendering.

```typescript
// contact-form.route.ts
import { Component } from '@angular/core';
import { AnarchitectsFeatureForm } from '@anarchitects/forms-angular/feature';

@Component({
  selector: 'app-contact-form-route',
  imports: [AnarchitectsFeatureForm],
  template: `
    <anarchitects-forms-feature-form
      [formId]="'contact_default'"
      [formVersion]="1"
      [pagePreset]="{
        layoutVariant: 'stacked',
        maxInlineSize: '42rem',
        spacing: 'comfortable',
        actionAlignment: 'end',
      }"
      [pageTitle]="'Contact us'"
      [pageCaption]="'Get in touch and we will get back to you as soon as possible.'"
    />
  `,
})
export class ContactFormRoute {}
```

This route uses the default forms-page experience:

- stacked form layout with comfortable spacing
- centered max width for readable page composition
- end-aligned submit actions
- semantic title/caption rendering above the form

### Advanced Header And Caption Composition

When a single title/caption pair is not enough, project additional composition regions directly into
the feature or UI form component. These slots are additive and do not require a wrapper component.

Available slot names:

- `app-forms-page-header`: replace the built-in title/subtitle/caption header with a custom header region
- `app-forms-caption-top`: render one or more caption blocks above the form/header area
- `app-forms-caption-bottom`: render one or more caption blocks below the form

```html
<anarchitects-forms-feature-form [formId]="'contact_default'" [formVersion]="1" [pageTitle]="'Support request'">
  <p anxSlot="app-forms-caption-top">Top caption A: Product support and onboarding</p>
  <p anxSlot="app-forms-caption-top">Top caption B: Billing and enterprise help</p>

  <p anxSlot="app-forms-caption-bottom">Bottom caption A: Typical response in one business day</p>
  <p anxSlot="app-forms-caption-bottom">Bottom caption B: Priority requests are triaged continuously</p>
</anarchitects-forms-feature-form>
```

Use `pageTitle`, `pageSubtitle`, and `pageCaption` for the easy path. Use slots when you need
multiple caption blocks or a fully custom page intro.

## Working with individual layers

You can opt into specific slices of the stack:

- **Config** – call `provideFormsConfig({ apiResourcePath: 'forms' })` to override the default API
  resource segment.
- **Data-access** – inject `FormsApi` from the data-access entry point to integrate the OpenAPI client
  with custom facades or state.
- **State** – register `...provideFormsState()` explicitly, then inject `FormsStore` to orchestrate
  requests and expose reactive signals for loading/error/submission status.
- **UI** – use `AnarchitectsUiForm`, `AnarchitectsFormsUiSubmissionList`, and
  `AnarchitectsFormsUiSubmissionDetail` directly if you manage orchestration elsewhere.

The advanced UI component exposes its writable `formModel` signal and generated
`signalForm` field tree. Values start and reset to non-null defaults (`''` for text-like
fields and `false` for booleans). Validation errors render after a field is touched or
dirty. A successful submission emits the existing `SubmissionRequestDTO`, resets the
field state and values, and never inserts `null` into the payload.

For hosts that await an asynchronous domain response, set `[resetOnSubmit]="false"`
on `AnarchitectsUiForm` to retain values and interaction state after emission.
The default remains `true`. The host decides when to remove or reset the form.
`nativeMethod="post"` opts into a native POST fallback (default: `get`). It does
not send an HTTP request by itself or make pre-hydration submission safe: SSR
consumers must also compose appropriate action controls and implicit-submission
behavior. Newsletter's UI tests this composition against actual SSR output.

## Migrating from the Reactive Forms release

This is a breaking Angular 22-only release:

- `formGroup` is replaced by `formModel` and `signalForm`.
- `runtimeValidators: ValidatorFn[]` is replaced by
  `schemaExtensions: FormsSchemaExtension[]`.
- `FormGroup`, `FormBuilder`, `formControlName`, and Reactive Forms directives are no
  longer part of the package implementation or public integration surface.
- The forms package no longer depends on the Common Angular design, composition,
  layout, or primitives packages. It owns its form behavior, layouts, slots, and
  templates, while `@anarchitects/tailwind` owns the styling foundation.
- Default controls are native semantic elements, so applications that targeted the
  retired wrapper component DOM must update their selectors and visual snapshots.

Use `AnarchitectsFormsSlotDirective` (`anxSlot`) for named content regions and
`AnarchitectsFormsTemplateDirective` (`ng-template[anxTemplate]`) for `field` and
`actions` template overrides. Both are exported from the root and `/ui` entry points.

## Publishing

This package is published as public npm modules. Secondary entry points are shipped as tree-shakeable
ESM bundles so only the layers you import are included in your application bundle.

## Development notes

- Keep HTTP integration inside `data-access`; avoid direct endpoint calls in components.
- Keep orchestration in `feature/state`, and keep `ui` components presentational.
- Keep route and form contract alignment by regenerating OpenAPI when DTO/controller schemas evolve.

## License

Released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
