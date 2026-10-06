# ADR-0010: Define Newsletter Domain Boundaries And Ports

- Status: Accepted
- Date: 2026-10-06
- Owners: Architecture maintainers
- Scope: Architecture foundation for [epic #428](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/428), delivered through [#429](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/429)

## Context

Fit Over Forty already implements newsletter signup, affirmative consent evidence,
provider-managed double opt-in, and signed withdrawal webhooks. The reusable brick
must preserve these behaviors while removing product copy, direct database access
from application services, provider-specific composition, and an implicit in-memory
rate limiter.

This decision defines the intended architecture for subsequent child issues. It
does not introduce packages or claim that the interfaces below are already shipped.

## Decision

### Bounded context and dependencies

Newsletter owns requests to subscribe to a newsletter, evidence of affirmative
consent and withdrawal, and synchronization with an external subscriber provider.
Consent evidence and the provider's delivery/subscription status are distinct:
recording consent does not prove completion of double opt-in or email delivery.

Newsletter does not own campaign authoring, campaign templates, marketing
automation, blog content, user accounts, legal policy authorship, or a general
workflow engine. A subscriber need not be an authenticated user.

- `newsletter -> blog` and `blog -> newsletter` dependencies are forbidden.
  Host applications compose a Newsletter CTA into Blog pages.
- Newsletter has no required dependency on Auth or Identity. Its TS and Nest
  layers remain independent of Forms. It exposes a typed domain subscription API
  rather than using Forms as its business API.
- Amendment for #437 (2026-10-06, explicit implementation direction): Angular UI
  reuses `@anarchitects/forms-angular/ui` and Forms TS renderer contract types.
  This presentation-only dependency supplies rendering and Signal Forms validation;
  Newsletter retains its own DTOs, consent policy, client, state and backend.
  Forms feature/state/data-access and Forms backend services are not dependencies.
  The graph allows these two package edges; path-aware ESLint limits them to UI.
- Newsletter may consume domain-neutral Common platform capabilities. Common
  must not import Newsletter or own its subscriber/consent semantics.
- MailerLite subscriber management belongs to Newsletter infrastructure, never
  `common-nest-mailer`. Common Mailer remains transport-only under ADR-0007.
- Package by capability and layer, without `newsletter-admin` or
  `newsletter-public` variants based solely on routes or access policy.

These rules apply ADR-0001's capability alignment, ADR-0002's audience-neutral
packaging, ADR-0004's Common boundary, and ADR-0006's typed domain APIs.

### Ownership

| Concern           | Newsletter brick owns                                                  | Host application owns                                                                    |
| ----------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Consent           | Affirmative-consent validation, version matching, append-only evidence | Exact wording, version lifecycle, accepted policy configuration, retention/access policy |
| Signup experience | Reusable accessible flow, explicit state scope, hydration safety       | Heading, CTA and success/error copy, privacy link, placement, styling composition        |
| Subscription      | Provider-neutral use case and double-opt-in requirement                | Provider/account selection, deployment secrets, provider-side double-opt-in setup        |
| Persistence       | Consent repository contract and optional TypeORM adapter               | DataSource, migrations, database operations and access control                           |
| Webhooks          | Signature verification adapter, normalization, durable deduplication   | Endpoint exposure, raw-body capture, secret provisioning                                 |
| Abuse controls    | Honeypot behavior and replaceable rate-limit boundary                  | Limits, trusted-client key resolution, adapter selection or gateway enforcement          |
| Composition       | Facade and advanced secondary entry points                             | Routes, API base/path, guards, Blog integration, operational monitoring                  |

No consumer-specific consent text, privacy route, provider credentials, or product
copy is a reusable domain constant. Client configuration and server configuration
must reference the same host-owned policy version. The server resolves the
authoritative wording from its configured policy; it does not trust client-supplied
wording as evidence. A stale or unknown version is rejected before recording a
grant or calling a provider. The initial surface uses host-supplied configuration;
a consent-policy read endpoint is not required for this epic.

### Package and layer responsibilities

| Intended surface                             | Responsibilities                                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@anarchitects/newsletter-ts`                | Framework-neutral subscription request/response DTOs, TypeBox route schemas, consent policy/version and grant/withdrawal concepts, neutral event data shared across boundaries |
| `newsletter-nest/application`                | Subscription and withdrawal use cases, business validation, `SubscriberPort` and `ConsentRepositoryPort` contracts and tokens                                                  |
| `newsletter-nest/presentation`               | HTTP validation/mapping, honeypot handling, rate limiting, webhook ingress delegation; domain route schemas imported from TS DTOs                                              |
| `newsletter-nest/infrastructure-persistence` | TypeORM evidence entities, repository implementation and atomic deduplication                                                                                                  |
| `newsletter-nest/infrastructure-mailerlite`  | Subscriber API calls, provider error/retry translation, raw-body signature verification and provider-event normalization                                                       |
| `newsletter-nest/config` and root facade     | Typed options, `registerAs` namespace, config-to-options mapping and module composition                                                                                        |
| `newsletter-angular/config`                  | Host copy, consent policy, privacy link and API configuration                                                                                                                  |
| `newsletter-angular/data-access`             | Typed HTTP transport using shared TS contracts                                                                                                                                 |
| `newsletter-angular/state`                   | Signup state and orchestration, explicitly registered through provider helpers                                                                                                 |
| `newsletter-angular/feature`                 | Compose UI, state and host configuration                                                                                                                                       |
| `newsletter-angular/ui`                      | Accessible inputs, consent checkbox, feedback and hydration-safe rendering                                                                                                     |

The table abbreviates Nest and Angular secondary entry points; their package
prefixes are `@anarchitects/newsletter-nest` and `@anarchitects/newsletter-angular`.
TS contracts contain no Nest/Angular DI, HTTP request objects, TypeORM entities,
MailerLite payloads, SDK types, or secrets. Backend port interfaces belong to the
application boundary even when their input/output values use TS contracts.

Nest dependencies follow `presentation -> application <- infrastructure`.
Angular dependencies follow `ui <- feature -> state -> data-access`; config is
available across layers. Stores must not use `providedIn: 'root'`. Root facade
exports provide easy consumption while secondary entry points preserve overrides.
`@RouteSchema` contains only Fastify schema fields; operation IDs and tags remain
centralized in `tools/api-specs/route-metadata.ts`.

### Subscriber provider seam

`SubscriberPort` accepts a neutral subscription request and requests provider-managed
double opt-in. It must not create a confirmed subscriber on someone's behalf or
bypass an existing provider opt-out. It exposes no provider account, group, SDK
response, or subscriber-existence details to public callers.

`MailerLiteSubscriberAdapter` implements this seam. Provider credentials and group
configuration are adapter options. Provider-specific status codes, retryable errors,
timeouts and bounded retry/backoff handling stay in this adapter; failures become
neutral application errors. The host must enable the provider-side settings needed
for double opt-in. An adapter that cannot meet this contract is not a production
substitute. Logging/no-op providers are explicit development/testing choices, never
a silent fallback for missing production credentials.

### Consent persistence seam and ordering

`ConsentRepositoryPort` owns append operations for grant and withdrawal evidence.
It offers an atomic append-once operation for normalized provider withdrawals,
returning recorded/duplicate outcomes without exposing ORM exceptions.

1. Validate affirmative consent and the configured policy version.
2. Persist the grant, including the server-resolved version and wording snapshot,
   email, recording time and permitted source/context evidence.
3. Only after successful persistence, call `SubscriberPort`.
4. A provider failure leaves the grant intact and returns a retryable failure;
   persistence failure prevents the provider call. There is no distributed
   transaction or promise of exactly-once provider delivery.

Ordinary subscription attempts may append separate grants. Provider-event retries
must not append duplicate withdrawals. Grants are not overwritten by withdrawals,
and withdrawals are recorded even if no local grant is known. A withdrawal does not
invent consent wording/version that was never presented.

The adapter enforces deduplication with a durable unique key scoped to the provider
source/account and event identity. If a provider lacks a stable event identifier,
its adapter derives a deterministic key from documented stable event fields that
distinguish separate withdrawals. A read-then-insert check or process-local set is
insufficient under concurrent delivery. Only a conflict on the event deduplication
constraint is a duplicate; other database failures propagate. Event identity and
evidence are committed atomically. Retries after partial batch processing safely
skip committed events and retry the remainder.

TypeORM entities remain internal. No cross-domain entity relations or entity
inheritance are introduced. Any future host-owned cross-domain database foreign
keys use integration schemas and the repository's two-datasource pattern.

### Webhook trust boundary

HTTP ingress supplies the exact raw request bytes and signature to the MailerLite
adapter. The adapter verifies the HMAC before interpreting provider events or
invoking withdrawal processing. Re-serializing parsed JSON is not raw-body capture.
Missing secrets, missing raw bytes, and invalid signatures fail closed without
evidence writes. A verified payload is normalized into neutral withdrawal events;
MailerLite event names and payload schemas remain in infrastructure.

Valid duplicate deliveries succeed without adding evidence. A storage failure
does not receive a success acknowledgement, allowing provider retries. Provider
signature verification and durable idempotency remain mandatory even when a host
protects the endpoint through a gateway. Signup limits must not consume the quota
needed for legitimate provider webhook retries.

### Rate-limiting decision

Use a replaceable **presentation-layer `NewsletterRateLimiterPort`**. It performs
an atomic consume operation for a host-resolved key and configured policy, returning
allowed/denied and retry timing. It contains no newsletter business rules and is
not required by the application use cases. Keep the seam in Newsletter initially;
sharing a technical concept alone does not justify moving it to Common.

Facade configuration must explicitly select one of:

- a supplied adapter, such as a host-owned shared/distributed limiter;
- the bundled in-memory implementation, explicitly opting into single-instance
  scope (counters reset on restart and are not shared across replicas);
- disabled library limiting, explicitly declaring that the host accepts this
  choice, typically because its gateway already enforces signup limits.

There is no implicit memory default and no silent disabled fallback when selection
is omitted. Limits and window sizes are configurable; Fit Over Forty's values are
not a reusable domain policy. Distributed deployments must select shared enforcement
or a gateway rather than treating per-process memory as a global quota. No shared
store dependency is mandated by this decision.

Presentation resolves client identity according to the host's trusted-proxy policy;
it must not blindly trust forwarded headers. Enabled limiting with no usable key or
an unavailable limiter fails closed with a generic service-unavailable response.
Quota exhaustion maps to HTTP 429 with retry timing. Neither the key nor the response
discloses whether an email is subscribed.

### Public behavior and composition

- Valid accepted requests use the same public response for new and existing
  subscribers. Provider account/subscriber status is not returned. Validation,
  throttling and operational errors remain distinguishable without enumeration.
- Honeypot matches receive the generic accepted response and cause no consent or
  subscriber writes. Other accepted requests pass configured rate limiting before
  application side effects.
- Angular renders affirmative consent unchecked. Before hydration or with JavaScript
  unavailable, neither click nor Enter may place an email in a native GET URL.
  This must be tested against server-rendered markup, not only hydrated handlers.
- `NewsletterModule.forRoot(options)` is explicit and environment-agnostic.
  `forRootFromConfig(overrides?)` uses the config entry point. Precedence is explicit
  overrides > config-derived values > safe hardcoded defaults. Required consent,
  adapter and rate-limit choices have no silent defaults.
- Hosts may replace provider and persistence adapters independently. MailerLite
  composition and its webhook route are enabled explicitly; disabling that adapter
  does not expose an unverified webhook or disable a custom subscriber provider.

## Consequences

Newsletter can evolve independently of Blog and of its initial provider. Consent
evidence remains durable across provider failures; the application can be tested
with fake ports. Hosts retain legal/product ownership and control state lifecycle.

Hosts must supply more explicit configuration than the source application needed.
An external provider call and local persistence are not atomic; operational retry
handling must account for this. The in-memory limiter is convenient for examples
but is not a distributed abuse-control solution. Append-only describes ordinary
grant/withdrawal processing, not an unlimited-retention policy; hosts own authorized
retention/erasure procedures outside these use cases.

## Delivery and validation

#429 delivers documentation only. #430 adds packages, domain/release registration
and boundary enforcement. #431–#437 implement these contracts and layers. #438
provides examples, OpenAPI, docs and integration proof. Each child has its own PR;
Newsletter publication waits for the coordinated epic-level release after all
children merge. Fit Over Forty migration follows that release.

Later validation must cover consent ordering and provider failure, stale policy
rejection, unconfirmed subscription behavior, anti-enumeration, forged/missing-body
webhooks, concurrent duplicate delivery, storage failure/retry, each limiter mode,
scoped Angular state, and signup before hydration. DDD translation preserves these
same scenarios. This documentation change introduces no runtime breaking change or
package deprecation.

## References

- [ADR-0001: Cross-repository alignment](0001-align-with-bricks-ddd-and-support-migration.md)
- [ADR-0002: Capability-first packaging](0002-do-not-split-libraries-by-audience-until-workflow-divergence-is-real.md)
- [ADR-0004: Common as platform](0004-define-common-as-platform-foundation-not-shared-dumping-ground.md)
- [ADR-0006: Typed domain APIs](0006-forms-must-not-replace-domain-apis.md)
- [ADR-0007: Common Mailer transport boundary](0007-common-mailer-is-transport-only.md)
- [Newsletter DDD alignment](../guides/alignment-with-bricks-ddd.md#newsletter-counterpart-intent)
- [Newsletter migration mapping](../guides/migration-to-bricks-ddd.md#newsletter-migration-mapping)
- [Fit Over Forty reference source at `6280bce`](https://github.com/anarchitects/fitoverforty/tree/6280bce07ee51d78f4bdf5d8235fcc82ea9f7456/libs/newsletter): `subscriber.port.ts`, `newsletter.service.ts`, `withdrawal.service.ts`, `webhook.controller.ts`, and `newsletter-cta.component.ts`. Source comments suggesting future absorption into Forms are not adopted; Newsletter keeps its own capability boundary.
