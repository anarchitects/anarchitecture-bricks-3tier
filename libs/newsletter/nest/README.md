# @anarchitects/newsletter-nest

Unreleased Newsletter backend package for [epic #428](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/428), implementing [ADR-0010](../../../docs/adr/0010-define-newsletter-domain-boundaries-and-ports.md).

## Features

- Provider-neutral subscription requests with affirmative consent and exact policy-version validation.
- Append-only consent evidence committed before requesting provider-managed double opt-in.
- Withdrawal processing with atomic repository deduplication and safe partial-batch retries.
- Framework-independent application services, composition tokens and fake-port unit tests.

## Installation

Do not publish this package independently. Newsletter packages await one coordinated
release after #429–#438 are merged and epic acceptance is complete.

## Usage

The application entry point supports explicit composition today. Supply adapters
implementing `ConsentRepositoryPort` and `SubscriberPort`; the services do not
register themselves with Nest or configure infrastructure.

```ts
import { NewsletterSubscriptionService, NewsletterWithdrawalService, type ConsentRepositoryPort, type SubscriberPort } from '@anarchitects/newsletter-nest/application';

function createNewsletter(consentRepository: ConsentRepositoryPort, subscriber: SubscriberPort) {
  const subscriptions = new NewsletterSubscriptionService(consentRepository, subscriber, { version: 'host-policy/v1', text: 'Exact wording supplied by your host.' });
  const withdrawals = new NewsletterWithdrawalService(consentRepository);
  return { subscriptions, withdrawals };
}
```

Call `subscriptions.subscribe` with `{ email, consent: true, consentVersion }`
and optional `source`. Successful requests return only `{ accepted: true }`, which
reveals neither subscriber existence nor confirmation/delivery status. The client
version must match the configured version exactly; the service snapshots the
server's wording. Change the host-managed version whenever its wording changes.

Requests are validated with the shared TS schema without coercion. Email addresses
must satisfy that schema (including no surrounding whitespace) and are then
lowercased consistently for evidence and provider requests. Optional source is
attribution only. An optional second argument `{ ipAddress }` must come from the
host's trusted context resolver, never directly from a browser or unchecked
forwarded header. Recording time comes from the server; an optional final
constructor argument `NewsletterClock` supports deterministic testing.

The service defensively acknowledges non-empty string honeypots without side
effects, even if the rest of the request is invalid. Presentation must also handle
honeypots before HTTP schema validation and apply the configured rate limiter
before calling the application for genuine requests.

### Subscription ordering and failure

1. Validate the request, affirmative consent and exact configured policy version.
2. Await `ConsentRepositoryPort.appendGrant` committing the evidence.
3. Call `SubscriberPort.subscribe` with email and optional source.

Persistence failure prevents the provider call. Provider failure preserves the
grant and returns a generic retryable error. Repeating a subscription attempt may
append another grant and call the provider again. There is no distributed
transaction, provider rollback or exactly-once delivery promise.

The subscriber adapter must request provider-managed double opt-in, preserve
existing opt-outs, and resolve identically for new/existing/opted-out addresses.
It returns no account, subscriber ID or status. Adapters own timeouts, bounded
retry/backoff and private operational diagnostics. Only operational failures may
reject; subscriber-existence errors must not escape as an enumeration channel.

### Withdrawal processing

Pass a batch of **verified and normalized** `NewsletterWithdrawalEvent` values to
`withdrawals.process(events)`. Signature verification, raw bytes and provider
payload parsing belong to infrastructure. This service is not a webhook verifier.

Each event contains `email`, `eventSource` and `dedupeKey`. Identity strings are
opaque and preserved exactly. The normalizing adapter must namespace identities
by provider/account and event and reuse them on retries. Different withdrawals
for the same email remain separate events.

The application validates and snapshots the entire batch before writing, then
calls `appendWithdrawalOnce` sequentially. The repository must commit identity
and evidence atomically with durable uniqueness on `(eventSource, dedupeKey)`.
Only that identity conflict returns `duplicate`; unrelated storage failures
reject. A read-before-write check or process-local set is not a production
implementation of this contract.

The result `{ recorded, duplicates }` is an internal processing summary. Withdrawals
append even without a known grant and never invent consent wording/version or
modify earlier evidence. A failure stops the batch and rejects: ingress must not
acknowledge it as success. Retry the full batch with unchanged identities; committed
events become duplicates and the remaining events can be recorded. Concurrent
deliveries depend on the same repository guarantee, not service-instance state.

### Errors

| Error                          | Meaning                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| `NewsletterValidationError`    | Invalid request/context/withdrawal or policy mismatch; exposes a neutral `code`.           |
| `NewsletterConfigurationError` | Missing/blank policy configuration or invalid server recording time.                       |
| `NewsletterUnavailableError`   | Persistence/provider failure; `retryable: true`, with a neutral storage/subscriber `code`. |

Errors contain no submitted values, provider payloads, database details or adapter
exception causes. Presentation owns HTTP mapping. Adapters must retain any needed
private diagnostics themselves without exposing them through these errors.

## Entry points

`application` exports `NewsletterSubscriptionService`, `NewsletterWithdrawalService`,
their context/result/clock types, error classes, and the `SubscriberPort` and
`ConsentRepositoryPort` interfaces with `SUBSCRIBER_PORT` and
`CONSENT_REPOSITORY_PORT` symbols for future composition.

The root facade, `config`, `presentation`, `infrastructure-persistence` and
`infrastructure-mailerlite` entry points remain empty until their respective epic
issues. Easy-mode `NewsletterModule.forRoot`/`forRootFromConfig` arrives with #435;
this change provides the advanced application seam only.

## Development notes

Run from the workspace root:

```sh
yarn nx run-many -p newsletter-nest -t lint test typecheck typecheck-tests build package-smoke
```

Tests use fake subscriber and in-memory repository ports. They validate application
behavior and the append-once contract, not a database's concurrency guarantees;
the persistence adapter needs its own integration coverage in #433.

`package-smoke` checks built runtime exports and strict Node16 declaration
resolution from isolated CommonJS and ESM consumers without workspace aliases.

The root carries `domain:newsletter`, `tech:nest` and `type:facade` tags. Layers
inside this publishable project are enforced by path-aware ESLint rules. Newsletter
depends only on its own domain and compatible Common platform bricks; host
applications own composition with Blog and other business capabilities.
