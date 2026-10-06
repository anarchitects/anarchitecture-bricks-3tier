# @anarchitects/newsletter-angular

Unreleased Newsletter Angular signup UI, client and state for [epic #428](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/428), implementing [ADR-0010](../../../docs/adr/0010-define-newsletter-domain-boundaries-and-ports.md).

## Features

- Reusable signup CTA built with `@anarchitects/forms-angular/ui`.
- Host-owned copy, privacy link, consent and accessible status/error feedback.
- SSR-safe click/Enter behavior before hydration and without JavaScript.
- Configurable subscription endpoint and host-owned consent policy.
- HTTP client using shared Newsletter TS request/response contracts.
- Explicitly scoped signals for idle, submitting, success and failure states.
- Neutral acknowledgements and error metadata without subscriber/provider details.
- Duplicate submission suppression, bounded requests and lifecycle cancellation.

## Installation

Newsletter packages await one coordinated release after #429–#438 and #445–#448 are merged and
epic acceptance is complete. Angular common/core/forms `^22.0.0` and RxJS
`~7.8.0` are peers. The Forms renderer uses Angular 22 Signal Forms, so the
previous unreleased Angular 21 compatibility range is narrowed to Angular 22.
Dependencies include Newsletter TS contracts, Forms Angular and Forms TS.

Before publishing Newsletter, release the Forms renderer additions in this change
(`resetOnSubmit` and `nativeMethod`) and update the Newsletter dependency minimum
to that published Forms version. The current workspace versions are unreleased
integration metadata, not a claim that older Forms releases provide these inputs.
Use the CI-owned release flow; no package publication is part of #437.

Install the Forms peer dependencies described in the [Forms Angular README](../../forms/angular/README.md)
and configure its Tailwind styling foundation in the host stylesheet:

```css
@import '@anarchitects/tailwind';
@source './app';
@source '../node_modules/@anarchitects/forms-angular';
@source '../node_modules/@anarchitects/newsletter-angular';
```

Host theme tokens control colors, borders, spacing and density.

## Usage

Configure `HttpClient` once at the host application root using `provideHttpClient()`.
Use the root facade at the desired route or component scope:

```ts
import { provideNewsletter } from '@anarchitects/newsletter-angular';

export const newsletterProviders = provideNewsletter({
  apiBaseUrl: '/api',
  apiResourcePath: 'newsletter',
  consent: {
    version: 'host-policy/v1',
    text: 'Exact host-owned wording matching the backend policy.',
  },
});
```

Install `newsletterProviders` in a route's or component's `providers` array. Each
such scope gets its own store and API client. App-wide state is also possible by
installing the providers at bootstrap; nothing is registered globally by default.
Host HTTP interceptors, credentials, CORS, and proxy policy remain host-owned.

Inject `NewsletterStore` from the root or `state` entry point. Read `consent` to
render the configured wording and capture its version alongside affirmative user
consent. Call `submit` with a `NewsletterSubscriptionRequestDTO` only after the user
has explicitly agreed:

```ts
import { inject } from '@angular/core';
import { NewsletterStore } from '@anarchitects/newsletter-angular';
import type { NewsletterSubscriptionRequestDTO } from '@anarchitects/newsletter-ts/dtos';

// Inside a host component or service:
readonly newsletter = inject(NewsletterStore);

submit(request: NewsletterSubscriptionRequestDTO) {
  return this.newsletter.submit(request);
}
```

The request includes `email`, literal `consent: true`, and the version of the policy
shown to the user. `source` and the `website` honeypot are optional. The client does
not automatically grant consent, overwrite a displayed version with a newer one,
or normalize the email. The server validates consent and policy version and owns
honeypot handling. A stale version produces `invalid_request`; it is never silently
upgraded. Keep wording and version synchronized with backend configuration.

No policy is fetched from an endpoint. No UI, consent checkbox, legal copy, styles,
or reusable CTA is included yet; #437 owns that surface. Hosts must prevent native
form submission from putting an email in a GET URL before hydration or without JS.
The client sends JSON in a POST and disables Angular transfer caching for that
request. It never sends submitted fields in the URL or stores them in browser storage.

### Configuration

`provideNewsletterConfig(config)` supplies the `NEWSLETTER_CONFIG` token. It
validates and snapshots the options into an immutable `ResolvedNewsletterConfig`.
No browser globals or environment variables are read, so configuration also works
in SSR and tests. Invalid configuration fails without echoing supplied values.

| Option             | Behavior                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| `consent`          | Required shared `NewsletterConsentPolicy`; nonblank version and text, retained exactly                 |
| `apiBaseUrl`       | Optional HTTP(S) origin and/or root-relative API prefix; default empty (same origin, no global prefix) |
| `apiResourcePath`  | Capability prefix; default `newsletter`, supports nested paths such as `marketing/news`                |
| `requestTimeoutMs` | Request deadline of 1–2,147,483,647 ms; default 10,000 ms                                              |

The endpoint is `<apiBaseUrl>/<apiResourcePath>/subscribe`. Boundary slashes are
normalized. For example, `/api/` plus `/newsletter/` becomes
`/api/newsletter/subscribe`. There is no implicit `/api` prefix. Query strings,
fragments, credentials, protocol-relative URLs and non-HTTP schemes are rejected.
An SSR host using a relative URL must configure its HTTP transport/base origin;
an absolute API URL is also supported. Separate injector scopes can use separate
endpoints and policies without sharing state.

### Submission state

The readonly `state` signal exposes a discriminated `NewsletterSubmissionState`:

| Status       | Meaning                                                                            |
| ------------ | ---------------------------------------------------------------------------------- |
| `idle`       | No current attempt, including after reset                                          |
| `submitting` | One request is pending                                                             |
| `success`    | Generic acceptance only; does not assert existence, confirmation or email delivery |
| `failure`    | Safe `code`, with optional `retryAfterSeconds` for throttling                      |

`status()` and `submitting()` are derived signals. No submitted email, raw response,
provider status, or raw error message is retained in state. Hosts translate codes
into their own copy:

- `invalid_request`: HTTP 400, including stale policy/invalid consent.
- `rate_limited`: HTTP 429; a valid `Retry-After` seconds or HTTP-date header supplies retry timing.
- `unavailable`: transport error, timeout, invalid acknowledgement, or other HTTP error.

`submit` resolves `{ accepted: true }` on success, and `undefined` on failure,
cancellation, destruction, or an ignored overlapping call. Success is identical
for new, existing and honeypot requests. Additional server fields are discarded;
malformed acknowledgements fail closed. A new attempt clears stale failure state.
No request is retried automatically: a retry can append another server consent grant.

`reset()` clears local state and unsubscribes pending HTTP. Destroying the provider
scope also cancels observation and prevents subsequent submissions. Late results
cannot overwrite a reset or newer attempt. Cancellation cannot undo work that the
server has already accepted. Concurrent submissions in the same store are ignored;
independent store scopes submit independently.

### Advanced composition

Compose secondary entry points to override one layer:

```ts
import { provideNewsletterConfig } from '@anarchitects/newsletter-angular/config';
import { provideNewsletterDataAccess } from '@anarchitects/newsletter-angular/data-access';
import { provideNewsletterState } from '@anarchitects/newsletter-angular/state';

const providers = [...provideNewsletterConfig({ consent: hostPolicy, apiBaseUrl: '/api' }), ...provideNewsletterDataAccess(), ...provideNewsletterState()];
```

`provideNewsletterState()` provides only `NewsletterStore`; it expects config and
`NewsletterApi` in its injector hierarchy. `provideNewsletterDataAccess()` provides
only `NewsletterApi` and expects config plus host-provided `HttpClient`. Neither
helper installs HTTP infrastructure. A host can override `NewsletterApi` through
Angular DI for a custom transport or tests. Its `subscribe(dto)` contract returns
an Observable of the shared acknowledgement, or throws `NewsletterApiError` with
safe metadata. Unexpected failures become generic `unavailable` in state.

Data-access-only consumers can subscribe to `NewsletterApi.subscribe(dto)` directly.
It is a cold Observable: each subscription sends a POST. Those consumers own
subscription lifetime and duplicate suppression. The store supplies that lifecycle
for reusable features without requiring UI components to orchestrate `HttpClient`.

### Signup CTA (easy mode)

Import `NewsletterSignupFeature` from the root and install `provideNewsletter`
at a component or route scope. Supply a document-unique `idPrefix` that is stable
between server and client, plus all user-facing copy:

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NewsletterSignupFeature, provideNewsletter, type NewsletterSignupPresentation } from '@anarchitects/newsletter-angular';

@Component({
  selector: 'host-newsletter',
  imports: [NewsletterSignupFeature],
  providers: [
    ...provideNewsletter({
      apiBaseUrl: '/api',
      consent: { version: 'host-policy/v1', text: 'I agree to receive host updates.' },
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<anarchitects-newsletter-signup-feature idPrefix="footer-newsletter" [presentation]="copy" source="footer" />`,
})
export class HostNewsletter {
  readonly copy: NewsletterSignupPresentation = {
    heading: 'Newsletter',
    description: 'Updates from our team.',
    emailLabel: 'Email address',
    submitLabel: 'Sign up',
    submittingMessage: 'Sending request…',
    successMessage: 'Your request has been received.',
    invalidEmailMessage: 'Enter a valid email address.',
    consentRequiredMessage: 'Please agree to receive the newsletter.',
    invalidRequestMessage: 'Review your details and consent.',
    rateLimitedMessage: 'Please try again later.',
    unavailableMessage: 'Unable to send. Please try again.',
    honeypotLabel: 'Leave this field empty',
    privacy: { href: '/your-privacy-route', label: 'Privacy information', target: '_blank' },
  };
}
```

Example wording/routes are placeholders, never library defaults. The optional
privacy link defaults to `_self`; `_blank` adds `noopener noreferrer`. Copy is
rendered as plain text. Consent starts unchecked. Keep success copy generic: an
accepted request does not prove a new subscription, confirmation, or delivery.
The optional `source` is explicit attribution, never collected from the URL.

The feature delegates through `NewsletterStore`; only data-access owns HTTP.
Fields are disabled while submitting, retry retains values after safe failures,
and generic acceptance removes the form and announces the host message. Form
values remain transient component state. Separate provider scopes isolate CTAs;
instances sharing a store scope intentionally share their submission status.

### Signup UI (advanced mode)

`NewsletterSignup` from `@anarchitects/newsletter-angular/ui` is a presentation
component. Required inputs are `idPrefix`, `policy`, and `presentation`; optional
inputs are `busy`, `accepted` and `failureMessage`. Its `signupRequested` output
contains the Newsletter request DTO with email, affirmative consent, the displayed
policy version, and the `website` honeypot. A policy change clears earlier consent.
Hosts own orchestration when using this UI directly. `provideNewsletterFeature`
from `feature` is equivalent to the root `provideNewsletter`; state also exposes
`provideNewsletterStateWithDataAccess` for composing its default API adapter.

The UI uses the Forms renderer's field/action templates and schema extensions,
without Forms feature providers, stored form definitions, submission APIs, or
backend services. Layout uses Forms styling hooks plus minimal Newsletter styles.

The server-rendered form contains a `type="button"` action and two enabled
text-like inputs (email and the visually hidden honeypot). These suppress implicit
native Enter submission without relying on an Angular handler. Native method is
also `post` as a defense against GET URLs. After hydration, click and email Enter
run Forms validation and emit the Newsletter DTO. The trap stays out of tab order
and the accessibility tree; do not replace it with `type="hidden"` or disable it
in initial SSR markup. Submission requires client hydration; no-JS/pre-hydration
interaction intentionally sends nothing. The package does not claim to provide
a server-side HTML form endpoint.

## Entry points

- Root: `provideNewsletter`, `NewsletterSignupFeature`, `NewsletterStore`, state/config/presentation types.
- `config`: typed options, resolved token, validation/resolution and provider helper.
- `data-access`: `NewsletterApi`, safe error class/codes and provider helper.
- `state`: explicitly scoped store, state type and provider helper.
- `feature`: signup orchestration component and composed provider helper.
- `ui`: Forms-backed signup presentation component.

## Development notes

Run from the workspace root:

```sh
yarn nx run-many -p newsletter-angular -t lint test typecheck typecheck-tests build package-smoke
yarn playwright install chromium
yarn nx run newsletter-angular:test-hydration
yarn nx run storybook-angular:build-storybook
yarn nx run docs-hub:validate-content
```

Unit tests exercise component/feature interactions, consent, validation, retry and
HTTP contracts, neutral errors, timeout/throttle metadata,
state transitions, reset/destruction, duplicate suppression and injector isolation.
The package smoke target checks built ESM exports, strict consumer declarations
without workspace aliases and scoped state in Node without browser globals.
The browser regression renders two real feature instances using Angular SSR and
checks click/Enter with JavaScript disabled and before client bootstrap. Storybook
includes idle, pending, accepted, retry and localized examples.

The root carries `domain:newsletter`, `tech:angular` and `type:facade` tags. Layers
inside this publishable project are enforced by path-aware ESLint rules. State
depends on data-access; config is available to all layers. The only Forms imports
allowed are the renderer and its contract types in UI. Newsletter business logic
remains independent; hosts own composition with Blog and other capabilities.
