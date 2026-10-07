# @anarchitects/newsletter-ts

Framework-neutral subscription schemas and consent evidence contracts for Newsletter.
This package follows [ADR-0010](../../../docs/adr/0010-define-newsletter-domain-boundaries-and-ports.md)
and is implemented under [epic #428](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/428).

## Features

- TypeBox subscription request and response schemas with inferred DTO types.
- A subscription route schema containing only `body` and `response` fields.
- Consumer-owned consent policy configuration and distinct grant/withdrawal models.
- Native operational subscriber/status types, separate from consent evidence.
- Identical acknowledgement shape for new and existing addresses, without subscriber
  IDs, provider status or confirmation status.
- ESM, CommonJS and TypeScript declarations at the root and secondary entry points.

The only runtime dependency is TypeBox. There are no Angular, Nest, TypeORM,
provider SDK, Blog or other business-domain dependencies.

`NewsletterNativeSubscriber` and `NewsletterNativeSubscriberStatus` are exported
from `models` and the root. They describe internal operational identity, scope,
`pending_confirmation`/`active`/`unsubscribed` status, lifecycle generation and server
timestamps. They are not public subscription-response DTOs, confirmation proof,
or replacements for append-only consent events. Raw token secrets are never part
of these models; backend token and repository contracts belong to Nest application ports.

## Installation

Newsletter has not been released. Do not publish this package incrementally: wait
until #429–#438 and #445–#448 merge and epic acceptance is complete, then use the coordinated
Newsletter release workflow. Workspace development uses the source aliases below.

## Usage

```ts
import { Value } from '@sinclair/typebox/value';
import { NewsletterSubscriptionRequestSchema, type NewsletterConsentPolicy, type NewsletterSubscriptionRequestDTO, type NewsletterSubscriptionResponseDTO } from '@anarchitects/newsletter-ts';

// Illustrative host-owned copy; the brick supplies no default wording or version.
const policy: NewsletterConsentPolicy = {
  version: 'example-policy-v1',
  text: 'Send me Example updates by email.',
};

const request: NewsletterSubscriptionRequestDTO = {
  email: 'reader@example.test',
  consent: true,
  consentVersion: policy.version,
  source: '/updates',
  website: '',
};

Value.Check(NewsletterSubscriptionRequestSchema, request); // true
const response: NewsletterSubscriptionResponseDTO = { accepted: true };
```

Validation does not record consent, contact a provider or determine whether the
policy version is current. It performs no coercion, trimming or lowercasing. The
schema has no global format-registration side effects and works with TypeBox Value
or a JSON Schema validator. Callers should trim email input before submission;
backend canonicalization and policy-version matching belong to the application.
The permissive email syntax is not proof of ownership; double opt-in remains required.

### Subscription API

| Request field    | Contract                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------- |
| `email`          | Required string, at most 254 characters, one `@`, a dotted domain and no whitespace         |
| `consent`        | Required literal `true`; strings and truthy values are invalid                              |
| `consentVersion` | Required non-blank string; an opaque, exact host-managed identifier, not necessarily semver |
| `source`         | Optional attribution string, at most 2048 characters; no particular host route is assumed   |
| `website`        | Optional honeypot string, at most 2048 characters                                           |

Additional properties are excluded. In particular, the browser cannot supply
`consentText`, `ipAddress`, `recordedAt` or provider identifiers through this DTO.

`NewsletterSubscriptionResponseSchema` accepts only `{ accepted: true }`.
`NewsletterSubscriptionRouteSchema` maps the request body and HTTP **202** response.
Acceptance does not assert a new subscriber, a successful email delivery or completed
double opt-in. It is also the presentation response for discarded honeypot attempts.
Validation, throttling and operational errors are separate presentation concerns;
this package does not prescribe a framework-specific error envelope.

The presentation implementation must inspect the honeypot before application side
effects and return the generic acknowledgement without recording consent or calling
the provider. If it must acknowledge malformed honeypot submissions too, it must
intercept those before normal request-schema validation. The schema accepts a
non-empty `website` string structurally; it does not implement that behavior.

Controllers consume the exported route schema rather than declaring inline TypeBox
schemas. Routes, OpenAPI operation IDs and tags are configured outside this package.

### Native confirmation/unsubscribe API

`NewsletterNativeActionRequestSchema` / `NewsletterNativeActionRequestDTO` accept only
`{ token: string }`, bounded to 128 characters. This validates request shape, not bearer
validity. Empty, malformed, expired or replayed token strings receive the same neutral
acknowledgement as valid tokens; the backend decides whether any state transition occurs.
`NewsletterNativeActionResponseSchema` / `NewsletterNativeActionResponseDTO` describe
`{ accepted: true }`. `NewsletterNativeActionRouteSchema` maps body and 202 response for
both native POST actions. These contracts are exported from the root and `dtos`.
No response contains membership state, addresses or token material. Browser landing pages
submit the token in a POST body after a user action; GET must not consume it.

### Consent configuration and evidence

`NewsletterConsentPolicy` requires `version` and exact `text`. The host owns both,
including version changes, privacy/legal content, CTA wording and route placement.
The frontend and backend receive matching configuration. The backend validates its
configuration, rejects unknown/stale versions, and snapshots its own authoritative
wording; it never uses browser-supplied wording as consent evidence.

`NewsletterConsentEvent` is a discriminated union:

| Model                             | Meaning and fields                                                                                                                                  |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NewsletterConsentGrantedEvent`   | `kind: 'granted'`, `email`, server `recordedAt`, required `consentVersion` and `consentText`; optional `source` and trusted `ipAddress`             |
| `NewsletterConsentWithdrawnEvent` | `kind: 'withdrawn'`, `email`, server `recordedAt`, `eventSource` and `dedupeKey`; no consent wording/version                                        |
| `NewsletterWithdrawalEvent`       | Normalized withdrawal input with `email`, `eventSource` and `dedupeKey`, after adapter verification and before the server stamps its recording time |

`recordedAt` is a `Date`, consistent with the repository's internal TS models. These
are in-process evidence models, not JSON response DTOs or persistence entities. No
storage-generated ID, provider subscriber ID or provider-status enum is introduced.
Optional values may be absent; a persistence adapter owns any conversion to database
nulls. Readonly properties express intent at compile time, not runtime immutability.

`eventSource` is an opaque source namespace. `dedupeKey` is a stable opaque identity
scoped to source/account and event, including a deterministic fallback when an adapter
needs one. Adapters reuse it on retries. The application/repository must atomically
append each withdrawal once, including withdrawals with no known local grant; these
types do not implement deduplication. Grants and withdrawals append evidence rather
than overwrite it. Evidence persistence precedes provider subscription attempts.

## Entry points

| Import                               | Public surface                                                                                                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@anarchitects/newsletter-ts`        | All models, DTO types and subscription/native-action runtime schemas                                                                                                                                         |
| `@anarchitects/newsletter-ts/dtos`   | `NewsletterSubscriptionRequestSchema`, `NewsletterSubscriptionRequestDTO`, `NewsletterSubscriptionResponseSchema`, `NewsletterSubscriptionResponseDTO`, `NewsletterSubscriptionRouteSchema` |
| `@anarchitects/newsletter-ts/models` | `NewsletterConsentPolicy`, `NewsletterConsentEvent`, `NewsletterConsentGrantedEvent`, `NewsletterConsentWithdrawnEvent`, `NewsletterWithdrawalEvent` (types only)                           |

## Development notes

```bash
yarn nx run-many -p newsletter-ts -t lint,test,typecheck,typecheck-tests,build
```

Tests validate schemas through TypeBox and AJV, exercise consent/email/length
boundaries, enforce the minimal response shape, and check the public type surface.
`typecheck-tests` checks the type assertions as well as the runtime test source.

Nest ports, policy enforcement, persistence, provider integration, rate limiting,
webhook verification and Angular orchestration are owned by later epic issues.
Consumers replace infrastructure through those Nest ports, not through provider
fields added to these DTOs. Shared contracts contain no deployment credentials or
consumer-specific consent constants. Changes to these public fields/schemas should
be treated as contract changes and validated against both frontend and backend uses.
