# @anarchitects/newsletter-angular

Unreleased Newsletter Angular client and state for [epic #428](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/428), implementing [ADR-0010](../../../docs/adr/0010-define-newsletter-domain-boundaries-and-ports.md).

## Features

- Configurable subscription endpoint and host-owned consent policy.
- HTTP client using shared Newsletter TS request/response contracts.
- Explicitly scoped signals for idle, submitting, success and failure states.
- Neutral acknowledgements and error metadata without subscriber/provider details.
- Duplicate submission suppression, bounded requests and lifecycle cancellation.

## Installation

Newsletter packages await one coordinated release after #429–#438 are merged and
epic acceptance is complete. Angular common/core `^21.1.0 || ^22.0.0` and RxJS
`~7.8.0` are peers; the package depends on the matching Newsletter TS contracts.

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

## Entry points

- Root: `provideNewsletter`, `NewsletterStore`, state and config types.
- `config`: typed options, resolved token, validation/resolution and provider helper.
- `data-access`: `NewsletterApi`, safe error class/codes and provider helper.
- `state`: explicitly scoped store, state type and provider helper.
- `feature` and `ui`: reserved for #437.

## Development notes

Run from the workspace root:

```sh
yarn nx run-many -p newsletter-angular -t lint test typecheck typecheck-tests build package-smoke
yarn nx run docs-hub:validate-content
```

Unit tests exercise HTTP contracts, neutral errors, timeout/throttle metadata,
state transitions, reset/destruction, duplicate suppression and injector isolation.
The package smoke target checks built ESM exports, strict consumer declarations
without workspace aliases and scoped state in Node without browser globals.

The root carries `domain:newsletter`, `tech:angular` and `type:facade` tags. Layers
inside this publishable project are enforced by path-aware ESLint rules. State
depends on data-access; config is available to all layers. Newsletter depends only
on its own domain and compatible Common platform bricks; host applications own
composition with Blog and other business capabilities.
