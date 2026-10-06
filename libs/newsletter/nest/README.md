# @anarchitects/newsletter-nest

Unreleased Newsletter backend package for [epic #428](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/428), implementing [ADR-0010](../../../docs/adr/0010-define-newsletter-domain-boundaries-and-ports.md).

## Features

- Provider-neutral subscription requests with affirmative consent and exact policy-version validation.
- Append-only consent evidence committed before requesting provider-managed double opt-in.
- Withdrawal processing with atomic repository deduplication and safe partial-batch retries.
- Framework-independent application services, composition tokens and fake-port unit tests.
- PostgreSQL/TypeORM consent persistence with a migration and concurrent-delivery integration tests.
- Optional MailerLite subscriber and signed withdrawal-webhook adapters.

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

### PostgreSQL persistence

`infrastructure-persistence` exports `NewsletterConsentEntity`,
`TypeOrmConsentRepository`, `CreateNewsletterConsentEvents1791244800000` and
`NEWSLETTER_SCHEMA`. TypeORM `^1.1.0` is an optional peer: install it and the `pg`
driver when selecting this adapter. Application-only consumers need neither.

Register the entity and migration in the host-owned PostgreSQL DataSource:

```ts
import { DataSource } from 'typeorm';
import { NewsletterConsentEntity, TypeOrmConsentRepository, CreateNewsletterConsentEvents1791244800000 } from '@anarchitects/newsletter-nest/infrastructure-persistence';

const dataSource = new DataSource({
  type: 'postgres',
  // Supply host-owned connection options here.
  entities: [NewsletterConsentEntity],
  migrations: [CreateNewsletterConsentEvents1791244800000],
  synchronize: false,
});
await dataSource.initialize();
// Apply migrations through the host's deployment/migration process.
const consentRepository = new TypeOrmConsentRepository(dataSource);
```

Supply that repository to the application services or bind it to
`CONSENT_REPOSITORY_PORT` in host composition. It uses the DataSource's ordinary
connections so successful calls commit before returning; do not substitute a
transaction-bound manager or delay the commit until after a provider call.
PostgreSQL is the supported database for this adapter.

The migration creates `newsletter.consent_events`. Each row has a fresh UUID,
email, event kind and server recording timestamp. Grants store the exact policy
version/text and optional source/IP context; their provider identity columns are
NULL. Withdrawals store only their opaque event source/key and email/time, leaving
policy/source/IP fields NULL. Check constraints enforce those two shapes. An
email/timestamp index supports restricted audit queries through the host DataSource.
There are no cross-domain entity relations.

Uniqueness on `(event_source, dedupe_key)` makes concurrent withdrawal writes
atomic and durable. Only that named conflict is acknowledged as a duplicate;
other database failures propagate to the application error boundary. Normalization
belongs to the application/provider adapter; persistence preserves supplied
evidence and opaque identity strings exactly. Identity keys should be compact
enough for PostgreSQL's normal unique-index limits; oversized keys fail rather
than being truncated or silently treated as duplicates.

The repository exposes inserts only: it never updates, upserts or deletes evidence.
This is an application-level append-only contract, not a database trigger blocking
all host administration. Hosts own access, retention and authorized erasure; grant
runtime roles only the required SELECT/INSERT privileges where appropriate.
Rolling back this migration drops the consent table and its evidence, but leaves
the namespace and other host tables intact. Use forward migrations for deployed
evidence that must be retained; keep `synchronize: false` in production.

### MailerLite adapters

The `infrastructure-mailerlite` entry point provides explicit composition without
an SDK dependency or environment access:

```ts
import { MailerLiteSubscriberAdapter, MailerLiteWebhookAdapter } from '@anarchitects/newsletter-nest/infrastructure-mailerlite';
import type { NewsletterWithdrawalService } from '@anarchitects/newsletter-nest/application';

function createMailerLite(host: { apiKey: string; groupId: string; accountId: string; webhookSecret: string }, withdrawals: NewsletterWithdrawalService) {
  return {
    subscriber: new MailerLiteSubscriberAdapter({ apiKey: host.apiKey, groupId: host.groupId }),
    webhook: new MailerLiteWebhookAdapter({ webhookSecret: host.webhookSecret, accountId: host.accountId }, withdrawals),
  };
}
```

Supply `subscriber` to `NewsletterSubscriptionService` through its `SubscriberPort`.
The adapter posts to the fixed MailerLite Connect endpoint with `status: unconfirmed`
and `resubscribe: false`; it never requests active status or forced resubscription.
**Enable Double opt-in for API and integrations in the MailerLite account first.**
This setting and confirmation-email delivery cannot be verified by local tests.
See MailerLite's [double opt-in guidance](https://www.mailerlite.com/help/how-to-use-double-opt-in-when-collecting-subscribers)
and [subscriber API](https://developers.mailerlite.com/api/subscribers).

Set `sourceField` only when an existing MailerLite custom field should receive
the request's optional source. Otherwise no custom fields are sent. Configuration
is copied on construction; missing credentials/group IDs fail closed. There is no
automatic logging/no-op fallback or controller registration.

All 2xx and 422 responses resolve without provider data, preserving the reference
adapter's anti-enumeration policy. A 422 is a general provider validation response,
not proof of an existing subscriber; this policy can also mask invalid provider
field configuration. Other failures become generic `NewsletterUnavailableError`
values without provider bodies, credentials or submitted emails.

Network failures, timeouts, 408, 429 and 5xx receive bounded retries. Defaults are
two total attempts, 5000ms per attempt, 250ms exponential backoff and a 2000ms
maximum retry delay. Options cap attempts at three and timeout/delay at 30000ms.
`Retry-After` seconds or HTTP dates are respected; a delay beyond the configured
budget fails for a later caller retry instead of retrying too soon. Redirects
are rejected. An optional second constructor argument injects `fetch` and `sleep`
for tests; production uses native fetch. No response body is interpreted or exposed.

#### Signed webhook ingress

Pass the **captured raw `Buffer`/`Uint8Array`** and the single `Signature` header
value to `webhook.receive(rawBody, signature)`. The adapter verifies a strict
64-character hex HMAC-SHA256 signature using the webhook secret, then parses those
same bytes. It does not accept parsed objects or reserialized JSON, and does not
implement the Classic API's signature scheme. Missing bytes, malformed signatures,
invalid UTF-8/JSON and invalid configuration fail closed. Ingress must also impose
its own body-size limit. See the [MailerLite webhook contract](https://developers.mailerlite.com/api/webhooks).

Supported deliveries are single flat events, nested subscriber events and
`{ events: [...] }` batches. Unsubscribe/delete events become neutral withdrawals;
other named events are ignored. Every relevant event must have a valid email,
subscriber ID and occurrence timestamp. The entire batch is normalized before
dispatch, so a malformed later event cannot commit a valid prefix. Defaults limit
input to 1 MiB and 1000 events, configurable within fixed upper bounds.

The host's numeric-string `accountId` sets the stable `mailerlite:<accountId>`
namespace. Any supplied payload account ID must match. The `v1:` dedupe key hashes
a JSON tuple of event name, subscriber ID and timestamp. Unsubscriptions use
`unsubscribed_at`, deletions use `deleted_at`/`forget_at`, with `updated_at` as the
fallback. Timestamp text retains microsecond precision. Subscriber IDs alone do
not identify an occurrence; absent identity data is rejected rather than collapsed
into a permanent dedupe key. Stable provider occurrence fields are required across
retries; distinct events with the same type, subscriber and timestamp are not
distinguishable by this provider-derived identity. Keep account namespace/key rules
stable when redeploying or rotating webhook secrets.

Storage failures propagate for retry, while duplicates return the application's
processing summary. Presentation must acknowledge only after `receive` succeeds,
or after a separately designed durable handoff. Signature verification alone does
not prevent replay: durable repository deduplication provides that protection.
`MailerLiteWebhookError.code` distinguishes missing raw bytes, signature, payload
and size failures for future HTTP mapping without leaking provider payloads.

## Entry points

`application` exports `NewsletterSubscriptionService`, `NewsletterWithdrawalService`,
their context/result/clock types, error classes, and the `SubscriberPort` and
`ConsentRepositoryPort` interfaces with `SUBSCRIBER_PORT` and
`CONSENT_REPOSITORY_PORT` symbols for future composition.

The root facade, `config` and `presentation` entry points remain empty until their respective epic
issues. Easy-mode `NewsletterModule.forRoot`/`forRootFromConfig` arrives with #435;
the application and infrastructure entry points support explicit composition today.

## Development notes

Run from the workspace root:

```sh
yarn nx run-many -p newsletter-nest -t lint test typecheck typecheck-tests build package-smoke
```

Application tests use fake subscriber and in-memory repository ports. Run the
PostgreSQL persistence suite with Docker available:

```sh
yarn nx run newsletter-nest:test-persistence
```

It starts and removes an isolated `postgres:16-alpine` container, applies the real
migration with synchronization disabled, and tests exact evidence, concurrent and
reconnected duplicate delivery, unrelated constraint failures, partial-batch retry,
metadata/schema agreement and rollback. The target is uncached and runs for affected
projects in the GitHub-hosted integration step in both CI workflows.

MailerLite tests use mocked fetch responses and locally signed fixtures, including
application-service integration. No live MailerLite network calls are needed.

`package-smoke` checks built runtime exports and strict Node16 declaration
resolution from isolated CommonJS and ESM consumers without workspace aliases.

The root carries `domain:newsletter`, `tech:nest` and `type:facade` tags. Layers
inside this publishable project are enforced by path-aware ESLint rules. Newsletter
depends only on its own domain and compatible Common platform bricks; host
applications own composition with Blog and other business capabilities.
