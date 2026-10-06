# @anarchitects/newsletter-nest

Unreleased Newsletter backend package for [epic #428](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/428), implementing [ADR-0010](../../../docs/adr/0010-define-newsletter-domain-boundaries-and-ports.md).

## Features

- Provider-neutral subscription requests with affirmative consent and exact policy-version validation.
- Append-only consent evidence committed before requesting provider-managed double opt-in.
- Withdrawal processing with atomic repository deduplication and safe partial-batch retries.
- Framework-independent application services, composition tokens and fake-port unit tests.
- PostgreSQL/TypeORM consent persistence with a migration and concurrent-delivery integration tests.
- Optional MailerLite subscriber and signed withdrawal-webhook adapters.
- Fastify HTTP controllers, explicit rate-limiter selection, and configurable Nest facade.

## Native implementation roadmap

[ADR-0010's #445 amendment](../../../docs/adr/0010-define-newsletter-domain-boundaries-and-ports.md#first-class-native-implementation-and-portability)
defines a production-usable native subscriber implementation, with mutable
pending/active/unsubscribed state distinct from append-only consent evidence.
Newsletter will own native double opt-in, unsubscribe and message semantics;
Common `MailerPort` will supply replaceable delivery. MailerLite remains optional.

#446 supplies the operational core, secure tokens and PostgreSQL persistence described
below. This is not yet an available `mode: 'native'` facade configuration: #447
adds mail delivery and #448 adds native HTTP/facade composition. Until then the root
facade selections remain `custom`, `mailerlite` and explicit `noop`. The native core
adapter implements `SubscriberPort` but sends no mail by itself. It is an implementation
stage, not a complete production signup flow or a silent fallback. No-op is not
production double opt-in. Campaign delivery remains outside #428.

## Installation

Do not publish this package independently. Newsletter packages await one coordinated
release after #429–#438 and #445–#448 are merged and epic acceptance is complete.

## Usage

### Easy mode: root facade

Import `NewsletterModule` from the root entry point. This example assumes the host
exports a durable `ConsentRepositoryPort` binding from `HostPersistenceModule`:

```ts
import { Module } from '@nestjs/common';
import { NewsletterModule } from '@anarchitects/newsletter-nest';
import { HostPersistenceModule, HOST_CONSENT_REPOSITORY } from './host-persistence.module';

@Module({
  imports: [
    NewsletterModule.forRoot({
      imports: [HostPersistenceModule],
      consent: { version: 'host-policy/v1', text: 'Exact wording shown by your host.' },
      persistence: { mode: 'custom', provider: { useExisting: HOST_CONSENT_REPOSITORY } },
      subscriber: { mode: 'noop' },
      rateLimit: { mode: 'memory', limit: 5, windowMs: 60_000 },
      presentation: { resolveClientKey: (request) => request.ip },
    }),
  ],
})
export class HostModule {}
```

The explicit `noop` subscriber records consent but does not send confirmation
emails or contact a provider. Select `{ mode: 'custom', provider: { useExisting:
HOST_SUBSCRIBER } }` for your own `SubscriberPort`, or select MailerLite explicitly:

```ts
subscriber: { mode: 'mailerlite', options: { apiKey, groupId } },
webhook: { webhookSecret, accountId },
```

The webhook is a separate opt-in and may also accompany a custom subscriber.
Absent/false `webhook` exposes no webhook route. Missing required credentials fail
startup. `provider` bindings support `useValue`, `useExisting`, or `useFactory` plus
`inject`. Export host tokens from modules listed in `imports`. Missing bindings or
missing required port methods fail startup; no fallback adapter is selected.

To use the bundled PostgreSQL adapter, select
`persistence: { mode: 'typeorm', dataSourceToken: HOST_DATA_SOURCE }` and import the
host module exporting that initialized DataSource. Register the entity/migration
as described below. The facade does not create connections or run migrations.
Custom persistence does not require the optional TypeORM peer.

Use Nest's Fastify adapter. Webhooks require raw-body capture at bootstrap:

```ts
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';

const app = await NestFactory.create<NestFastifyApplication>(HostModule, new FastifyAdapter({ bodyLimit: 1_048_576 }), { rawBody: true });
await app.listen(3000);
```

Do not replace captured bytes with reserialized JSON. Missing capture returns 503
without evidence writes. The host owns ingress body limits, trusted-proxy settings,
connection lifecycle, and any global URL prefix. The presentation module requires
Fastify and installs its route hook before Nest maps controllers.

### HTTP behavior

Default routes are `POST /newsletter/subscribe` and, when enabled,
`POST /newsletter/webhook`. Set `presentation.path` to a relative capability prefix
(e.g. `marketing/newsletter`); host global prefixes still apply. There is no policy
read endpoint: the host owns publishing the same policy to its frontend.

Subscriptions use the shared TS route schema with strict validation, without
coercing values or dropping additional fields. A non-empty string `website`
honeypot in parsed JSON returns 202 `{ accepted: true }` before schema validation,
limiter/context resolution, or writes. Malformed JSON and ingress size limits are
still enforced by Fastify. Genuine requests are validated, limited, and passed to
the application. Unknown/stale policy or invalid input returns generic 400;
limiter denial returns 429 with `Retry-After` in whole seconds; unavailable ports,
limiter, or key resolution return generic 503. Provider status is never returned.

Verified webhook deliveries return 200 `{ recorded, duplicates }` only after
persistence completes. Invalid signatures return 401, invalid payloads 400,
adapter size violations 413, and operational/storage failures 503. Subscription
limits never consume webhook quota; hosts can apply independent ingress controls.

No IP evidence is recorded by default. Supply `presentation.resolveContext` to
return trusted `{ ipAddress }` if required. `resolveClientKey` and `resolveContext`
receive the Fastify request; hosts own proxy trust and must not blindly copy
forwarded headers. Keys should identify the client, never subscriber existence.

### Explicit rate limiting

`rateLimit` is required; choose one mode:

- `{ mode: 'disabled' }`: explicit opt-out of library limiting, for example when a gateway enforces signup quotas.
- `{ mode: 'memory', limit, windowMs, maxKeys? }`: atomic fixed windows per key in this module instance. Counters reset on restart and are not shared across replicas. Default capacity is 10,000 keys; expired keys are reclaimed and full active capacity fails closed with 503.
- `{ mode: 'custom', limit, windowMs, provider }`: a host-owned `NewsletterRateLimiterPort`, typically a shared/distributed implementation.

Enabled modes require `presentation.resolveClientKey`. Missing/blank keys, invalid
adapter results, or limiter failures return 503. The custom port implements
`consume(key, policy)` atomically, resolving `{ allowed: true }` or
`{ allowed: false, retryAfterMs }`. Namespace keys when sharing a backend between
hosts. The memory implementation assumes one fixed policy per instance and keeps
no global singleton or background timer. Distributed deployments need shared or
gateway enforcement for a global quota.

### Config-driven initialization

`NewsletterModule.forRootFromConfig(overrides)` reads the `newsletterConfig`
namespace from the `config` entry point. Explicit overrides take precedence over
config values, then defaults. Consent and presentation fields merge individually;
adapter and limiter selections are replaced as a whole. `forRoot(options)` never
reads the environment. Both paths require consent, persistence, subscriber and
rate-limiter choices. Persistence bindings and request resolvers remain host-supplied.

| Environment variable                                                       | Purpose                                                |
| -------------------------------------------------------------------------- | ------------------------------------------------------ |
| `NEWSLETTER_CONSENT_VERSION`, `NEWSLETTER_CONSENT_TEXT`                    | Exact host policy                                      |
| `NEWSLETTER_SUBSCRIBER`                                                    | `noop` or `mailerlite`; custom providers use overrides |
| `NEWSLETTER_MAILERLITE_API_KEY`, `NEWSLETTER_MAILERLITE_GROUP_ID`          | MailerLite subscription configuration                  |
| `NEWSLETTER_MAILERLITE_WEBHOOK_ENABLED`                                    | Exact `true`/`false`; absent leaves route disabled     |
| `NEWSLETTER_MAILERLITE_WEBHOOK_SECRET`, `NEWSLETTER_MAILERLITE_ACCOUNT_ID` | Explicit webhook configuration                         |
| `NEWSLETTER_RATE_LIMIT_MODE`                                               | `disabled` or `memory`; custom limiters use overrides  |
| `NEWSLETTER_RATE_LIMIT_MAX`, `NEWSLETTER_RATE_LIMIT_WINDOW_MS`             | Positive integer memory quota/window                   |
| `NEWSLETTER_PATH`                                                          | Relative HTTP prefix; defaults to `newsletter`         |

Environment variables must be loaded before calling `forRootFromConfig`. Hosts
using an already-resolved config object can call `mapNewsletterConfigToOptions`
then `forRoot`. Advanced MailerLite retry/body limits and memory capacity are
available through explicit options/overrides.

```ts
NewsletterModule.forRootFromConfig({
  imports: [HostPersistenceModule],
  persistence: { mode: 'custom', provider: { useExisting: HOST_CONSENT_REPOSITORY } },
  presentation: { resolveClientKey: (request) => request.ip },
});
```

### Advanced composition

The `presentation` entry point exports `NewsletterPresentationModule.forRoot` for
hosts that compose application services themselves. Supply `imports` exporting
`NewsletterSubscriptionService` and, if `webhookEnabled: true`, the
`NEWSLETTER_WEBHOOK_HANDLER` token. The handler receives raw bytes/signature and
must verify before processing; it may throw sanitized Nest HTTP exceptions.
The presentation options own the route prefix, request resolvers and required
limiter choice, independently of infrastructure.

The application entry point supports explicit composition. Supply adapters
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

The subscriber adapter must request double opt-in through the selected
implementation, preserve existing opt-outs, and resolve identically for
new/existing/opted-out addresses.
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

### Native operational core (#446)

`NewsletterNativeLifecycleService` in `application` owns lifecycle decisions.
`NativeSubscriberAdapter` in `infrastructure-native` implements `SubscriberPort`
by invoking that service; `CryptoNativeToken` supplies cryptography. Persistence
is a separate `TypeOrmNativeSubscriberRepository` adapter. No MailerLite client,
credentials or Nest container is required for these classes.

Register all three entities and both migrations with the host PostgreSQL DataSource:

```ts
import { NewsletterConsentEntity, NewsletterNativeSubscriberEntity, NewsletterNativeTokenEntity, CreateNewsletterConsentEvents1791244800000, CreateNewsletterNativeSubscribers1791288000000, TypeOrmConsentRepository, TypeOrmNativeSubscriberRepository } from '@anarchitects/newsletter-nest/infrastructure-persistence';
import { NewsletterNativeLifecycleService, NewsletterSubscriptionService } from '@anarchitects/newsletter-nest/application';
import { CryptoNativeToken, NativeSubscriberAdapter } from '@anarchitects/newsletter-nest/infrastructure-native';

// In the host DataSource options; initialize and run migrations through host deployment tooling.
const entities = [NewsletterConsentEntity, NewsletterNativeSubscriberEntity, NewsletterNativeTokenEntity];
const migrations = [CreateNewsletterConsentEvents1791244800000, CreateNewsletterNativeSubscribers1791288000000];

// dataSource is the host's initialized DataSource with these entities/migrations.
const lifecycle = new NewsletterNativeLifecycleService(new TypeOrmNativeSubscriberRepository(dataSource), new CryptoNativeToken(), { scope: 'host-newsletter', confirmationTtlMs: 86_400_000, unsubscribeTtlMs: 2_592_000_000, resendCooldownMs: 60_000 });
const subscriber = new NativeSubscriberAdapter(lifecycle);
const subscriptions = new NewsletterSubscriptionService(new TypeOrmConsentRepository(dataSource), subscriber, hostConsentPolicy);
```

This constructs the **core only**. It records pending state without sending mail;
#447 will compose delivery and #448 will expose native facade/HTTP flows. Never
expose `prepareSubscription` as a public endpoint: it is an internal adapter seam
invoked after `NewsletterSubscriptionService` validates and commits affirmative
consent. It returns a transient `NewsletterNativePreparation` containing raw
confirmation/unsubscribe tokens for the future trusted mail handoff, or `undefined`
for active subscribers and suppressed resends. The core `NativeSubscriberAdapter`
discards that handoff and resolves `void`, preserving the existing subscriber port.
Preparation does not grant consent or authorize itself; bypassing the subscription
use case would bypass consent validation. Do not log, persist or return handoff
tokens in subscription acknowledgements.

Options live in `NewsletterNativeOptions` in `config`. `scope` is required, nonblank
and at most 128 characters; keep it stable across deployments and use separate
scopes for independently managed lists. Email canonicalization matches the existing
subscription use case (lowercase, no implicit trim). Durations are positive integer
milliseconds, capped at one year. The resend cooldown must not exceed either token
TTL. Defaults are 24-hour confirmation, 30-day unsubscribe and a 60-second cooldown.
Host clocks must be synchronized; tests can inject the existing `NewsletterClock`.
The cooldown supplements, rather than replaces, presentation/gateway abuse controls.

| Operation                               | State and token behavior                                                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| First accepted subscription             | Creates one `pending_confirmation` record and one token for each purpose                                                          |
| Repeat pending subscription             | Suppressed during cooldown; afterwards rotates both tokens atomically, preserving the subscriber and generation                   |
| Confirmation                            | A valid unconsumed current-generation token changes pending to active and is consumed atomically                                  |
| Repeat active subscription/confirmation | No new activation, token issuance or state change                                                                                 |
| Unsubscribe                             | Pending or active becomes unsubscribed; confirmation authority is removed and withdrawal evidence commits in the same transaction |
| Repeat unsubscribe                      | No state change or duplicate evidence                                                                                             |
| Fresh consent after unsubscribe         | Reuses the subscriber identity with a new generation and requires fresh confirmation; old links are invalid                       |

`confirm(secret)` and `unsubscribe(secret)` return `Promise<void>` for both valid
and ineffective attempts. Malformed, wrong-purpose, unknown, expired, consumed,
superseded and wrong-scope tokens cause no side effects and disclose no membership
status. Operational failure throws only neutral `NewsletterUnavailableError`.
These backend operations do not expose routes; #448 owns HTTP mapping and abuse
controls. An expired unsubscribe link does not change subscriber state; any future
renewal flow must establish authorization and must not silently resubscribe.

Bearer tokens contain 32 cryptographically random bytes (256 bits), a version and
a purpose prefix. PostgreSQL stores only SHA-256 verifiers, purpose, subscriber ID,
generation, expiry and consumption time. At most two token rows per subscriber are
retained; resends replace obsolete rows. Raw secrets cannot be recovered from the
repository. Once a preparation is lost, a later bounded resend must mint new tokens.

The migration creates `newsletter.native_subscribers` and `newsletter.native_tokens`;
consent remains in `newsletter.consent_events`. Operational rows may change, evidence
is insert-only. Native withdrawal identity is `native:<scope>` plus subscriber ID
and generation, so one lifecycle withdrawal is evidenced once. No cross-domain
entity relation is added; the token FK references a Newsletter subscriber only.

The repository uses PostgreSQL transaction-scoped advisory locks for absent/existing
scoped identities and row locks for existing subscribers. It rereads token authority
after locking. All mutations and native withdrawal evidence use the transaction's
manager; failed evidence/token writes roll back state and token consumption. No mail
or external network call belongs inside the transaction. These semantics follow
[PostgreSQL transaction-level locking](https://www.postgresql.org/docs/17/explicit-locking.html#ADVISORY-LOCKS)
and [TypeORM transaction-manager ownership](https://typeorm.io/docs/data-source/data-source-api/).
A grant already committed by the subscription service remains intact if native
persistence fails, preserving the existing evidence-before-subscriber contract.

Run the native migration after the consent migration with `synchronize: false`.
Its down migration drops only the two native tables, preserving consent and
host-owned objects; it deliberately destroys operational subscriber/token data.
Back up that state and plan rollback with the host before invoking a down migration.
The implementation adds no automatic migrations, mail transport or facade mode.

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
and size failures for HTTP mapping without leaking provider payloads.

## Entry points

`application` exports `NewsletterSubscriptionService`, `NewsletterWithdrawalService`,
`NewsletterNativeLifecycleService`, their context/result/clock types, error classes, and the `SubscriberPort` and
`ConsentRepositoryPort` interfaces with `SUBSCRIBER_PORT` and
`CONSENT_REPOSITORY_PORT` symbols for host composition. Native repository and token
ports have separate `NATIVE_SUBSCRIBER_REPOSITORY_PORT` and `NATIVE_TOKEN_PORT` symbols.
`infrastructure-native` exports the native core adapter and cryptographic token
implementation; `infrastructure-persistence` exports both consent and native storage.

The root exports `NewsletterModule` and its host-facing option types. `config`
exports the typed namespace, config mapper, validation and adapter option types.
`presentation` exports the controllers, composable module, webhook-handler seam,
and rate-limiter port/token/memory implementation.

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

Facade tests bootstrap Nest/Fastify and inject real HTTP requests to check strict
validation, honeypots, all limiter modes, custom providers, route/context options,
raw-body verification and operational failure responses. Configuration tests cover
both initialization paths and explicit override precedence.

MailerLite tests use mocked fetch responses and locally signed fixtures, including
application-service integration. No live MailerLite network calls are needed.

`package-smoke` checks built runtime exports and strict Node16 declaration
resolution from isolated CommonJS and ESM consumers without workspace aliases.

The root carries `domain:newsletter`, `tech:nest` and `type:facade` tags. Layers
inside this publishable project are enforced by path-aware ESLint rules. Newsletter
depends only on its own domain and compatible Common platform bricks; host
applications own composition with Blog and other business capabilities.
