# ADR-0010: Define Newsletter Domain Boundaries And Ports

- Status: Accepted
- Date: 2026-10-06
- Amendment: [#445](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/445), native implementation and optional external adapters (proposed; awaiting human review)
- Owners: Architecture maintainers
- Scope: Architecture foundation for [epic #428](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/428), delivered through [#429](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/429)

## Context

Fit Over Forty already implements newsletter signup, affirmative consent evidence,
provider-managed double opt-in, and signed withdrawal webhooks. The reusable brick
must preserve these behaviors while removing product copy, direct database access
from application services, provider-specific composition, and an implicit in-memory
rate limiter.

The original #429 decision established the domain seams around the reference
provider. The #445 amendment makes the portability requirement explicit: owning
an interface and an external adapter alone does not deliver the native capability.
This is architecture guidance, not a claim that native mode is already shipped.
Native persistence, tokens, mail flows and HTTP composition follow in #446–#448.

## Decision

### Bounded context and dependencies

Newsletter owns requests to subscribe to a newsletter, evidence of affirmative
consent and withdrawal, native subscriber lifecycle management, and optional
external subscriber integration. Consent evidence and operational subscriber
state are distinct:
recording consent does not prove completion of double opt-in or email delivery.

Newsletter does not own campaign authoring, campaign templates, marketing
automation, blog content, user accounts, legal policy authorship, or a general
workflow engine. Full ESP/campaign delivery is outside #428: no bulk-send
orchestration, bounce/complaint processing, sender-reputation management, or
proprietary delivery network is required. A subscriber need not be an authenticated user.

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

### First-class native implementation and portability

Newsletter must provide a production-usable Anarchitects-owned subscriber
implementation. A host can run subscriber management, double opt-in and unsubscribe
using Newsletter, durable storage and replaceable email transport, with no MailerLite
account, credentials, webhook or other newsletter SaaS. Native mode is a supported
production choice, not a demo, logging adapter or fallback.

Consumers explicitly select native, MailerLite or another conforming implementation
behind the same provider-neutral application contract. Selecting native must not
initialize an external subscriber client or require its credentials. Shared package
installation may include optional adapter code; runtime composition must remain
independent. There is no automatic switch to another provider on failure.

Portability does not require Anarchitects to own the underlying delivery network.
SMTP or delivery APIs such as SES/Postmark may carry Newsletter-owned messages
through a replaceable mail transport. Selecting that transport does not select a
subscriber-management provider.

### Ownership

| Concern           | Newsletter brick owns                                                               | Host application owns                                                                    |
| ----------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Consent           | Affirmative-consent validation, version matching, append-only evidence              | Exact wording, version lifecycle, accepted policy configuration, retention/access policy |
| Signup experience | Reusable accessible flow, explicit state scope, hydration safety                    | Heading, CTA and success/error copy, privacy link, placement, styling composition        |
| Subscription      | Provider-neutral use case, native lifecycle and double-opt-in/unsubscribe semantics | Native/external selection, external account setup where selected, deployment secrets     |
| Persistence       | Distinct operational subscriber and consent-evidence contracts/adapters             | DataSource, migrations, database operations and access control                           |
| Lifecycle mail    | Confirmation/unsubscribe intent, token use, URL generation and default rendering    | Trusted public URL configuration, sender/presentation overrides and transport selection  |
| Webhooks          | Signature verification adapter, normalization, durable deduplication                | Endpoint exposure, raw-body capture, secret provisioning                                 |
| Abuse controls    | Honeypot behavior and replaceable rate-limit boundary                               | Limits, trusted-client key resolution, adapter selection or gateway enforcement          |
| Composition       | Facade and advanced secondary entry points                                          | Routes, API base/path, guards, Blog integration, operational monitoring                  |

No consumer-specific consent text, privacy route, provider credentials, or product
copy is a reusable domain constant. Client configuration and server configuration
must reference the same host-owned policy version. The server resolves the
authoritative wording from its configured policy; it does not trust client-supplied
wording as evidence. A stale or unknown version is rejected before recording a
grant or calling a provider. The initial surface uses host-supplied configuration;
a consent-policy read endpoint is not required for this epic.

### Package and layer responsibilities

| Intended surface                             | Responsibilities                                                                                                                                                                         |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@anarchitects/newsletter-ts`                | Framework-neutral subscription request/response DTOs, TypeBox route schemas, consent policy/version and lifecycle/grant/withdrawal concepts, neutral event data shared across boundaries |
| `newsletter-nest/application`                | Subscription, native confirmation and withdrawal use cases; lifecycle validation; provider-neutral subscriber, operational-state and evidence ports                                      |
| `newsletter-nest/presentation`               | HTTP validation/mapping, native confirmation/unsubscribe ingress, honeypot handling, rate limiting, optional webhook ingress; domain route schemas imported from TS DTOs                 |
| `newsletter-nest/infrastructure-persistence` | Separate TypeORM operational subscriber/token and append-only evidence storage; atomic lifecycle updates and evidence deduplication                                                      |
| `newsletter-nest/infrastructure-native`      | First-class native `SubscriberPort` implementation; compose application lifecycle rules with durable persistence, secure token primitives and Common mail transport                      |
| `newsletter-nest/infrastructure-mailerlite`  | Subscriber API calls, provider error/retry translation, raw-body signature verification and provider-event normalization                                                                 |
| `newsletter-nest/config` and root facade     | Typed options, `registerAs` namespace, config-to-options mapping and module composition                                                                                                  |
| `newsletter-angular/config`                  | Host copy, consent policy, privacy link and API configuration                                                                                                                            |
| `newsletter-angular/data-access`             | Typed HTTP transport using shared TS contracts                                                                                                                                           |
| `newsletter-angular/state`                   | Signup state and orchestration, explicitly registered through provider helpers                                                                                                           |
| `newsletter-angular/feature`                 | Compose UI, state and host configuration                                                                                                                                                 |
| `newsletter-angular/ui`                      | Accessible inputs, consent checkbox, feedback and hydration-safe rendering                                                                                                               |

The table abbreviates Nest and Angular secondary entry points; their package
prefixes are `@anarchitects/newsletter-nest` and `@anarchitects/newsletter-angular`.
TS contracts contain no Nest/Angular DI, HTTP request objects, TypeORM entities,
MailerLite payloads, SDK types, or secrets. Backend port interfaces belong to the
application boundary even when their input/output values use TS contracts.

Nest dependencies follow `presentation -> application <- infrastructure`.
Angular dependencies follow `ui <- feature -> state -> data-access`; config is
available across layers. Stores must not use `providedIn: 'root'`. Root facade
exports provide easy consumption while secondary entry points preserve overrides.
The native surface is planned by #445, not an existing export. Lifecycle rules stay
in application services; token cryptography, persistence and transport adapters stay
in infrastructure. Native and MailerLite adapters do not import each other.
`@RouteSchema` contains only Fastify schema fields; operation IDs and tags remain
centralized in `tools/api-specs/route-metadata.ts`.

### Subscriber provider seam

`SubscriberPort` accepts a neutral subscription request and requests double opt-in
from the selected implementation. Native manages that lifecycle inside Newsletter;
MailerLite delegates it to the external provider. The contract must not require
external-provider terminology, SDK types, groups or account identifiers. The shared
subscribe DTO, neutral acknowledgement and Angular signup flow do not change with
provider selection. Internal native confirmation/unsubscribe and persistence seams
must not force external adapters to emulate native storage or token mechanics.

`MailerLiteSubscriberAdapter` remains an optional production adapter. Credentials,
group configuration, provider-specific status codes, retry/backoff and timeouts stay
in that adapter. The host must enable its provider-side double-opt-in settings.
Native and external implementations must not force-confirm an address or bypass an
opt-out. Missing required configuration fails startup; logging/no-op implementations
are explicit development/testing choices and do not satisfy the native requirement.

One subscriber implementation is authoritative per configured scope. Independent
host scopes may choose different implementations, but installing both does not
imply dual writes, synchronization or automatic failover. A host may explicitly
retain authenticated MailerLite webhook ingestion for historical external evidence;
it must not silently activate or change native subscriber state. Changing the
selected provider is a migration requiring reconciliation of opt-outs, confirmation
status and evidence, not a configuration shortcut that treats all grants as active.

### Operational state and consent evidence

| Concern        | Mutable operational subscriber state                                                                                       | Append-only consent/audit evidence                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Purpose        | Decide current lifecycle and permitted native actions                                                                      | Record what was agreed to or withdrawn and when                                                          |
| Ownership      | Native implementation owns its records; external provider owns its operational state in external mode                      | Newsletter owns its evidence independently of the selected subscriber implementation                     |
| Contents       | Scoped normalized identity, current lifecycle, concurrency/version data, token hashes/expiry and required attempt metadata | Grants with authoritative policy snapshots; withdrawals with source/event identity and permitted context |
| Writes         | Conditional updates and atomic token consumption                                                                           | Append grants; atomically append each withdrawal once                                                    |
| Interpretation | Current status is authoritative for native eligibility                                                                     | A grant alone never proves confirmation, current eligibility or mail delivery                            |

Keep these concerns separate even when they share one database. Unsubscribe must
not delete or overwrite prior grants; a later resubscription does not erase the
withdrawal. Operational records must not be reconstructed as active merely because
a grant exists. Confirmation records the operational proof of mailbox control, not
a new consent grant or an edit to the wording originally shown. Any additional
confirmation audit record is also append-only. Authorized retention/erasure remains
a host procedure, not ordinary lifecycle behavior.

### Native lifecycle and invariants

The native implementation owns at least `pending_confirmation`, `active` and
`unsubscribed`. The names describe intended semantics; #446 defines concrete types.
Identity is unique within the configured subscriber scope using the shared email
normalization policy. Separate attempts must not create duplicate subscriber rows.

| Starting state                 | Valid action                               | Result and invariant                                                                                         |
| ------------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| No record                      | Subscribe with current affirmative consent | Persist the grant first, then create pending state; require confirmation                                     |
| Pending confirmation           | Repeat subscribe                           | Keep one pending record; a controlled resend may rotate its confirmation token, never activate it            |
| Pending confirmation           | Confirm a valid current token              | Atomically consume the token and become active                                                               |
| Active                         | Repeat subscribe or confirmation           | Remain active with neutral public behavior; no duplicate activation or automatic confirmation mail           |
| Pending confirmation or active | Authorized unsubscribe                     | Become unsubscribed and atomically record withdrawal evidence; invalidate outstanding confirmation authority |
| Unsubscribed                   | Repeat unsubscribe                         | Remain unsubscribed; the same action must not append duplicate withdrawal evidence                           |
| Unsubscribed                   | Fresh affirmative subscription request     | Append a new grant and start a new pending attempt; require a fresh confirmation before activation           |

A new pending attempt never revives an old grant or bypasses an earlier opt-out.
Replayed confirmation from before withdrawal, including a race with unsubscribe,
must not reactivate the subscriber. Old confirmation/unsubscribe tokens cannot act
on a later resubscription generation. Invalid, expired, wrong-purpose and superseded
tokens have no state/evidence effects. Repeating a completed action has a neutral,
idempotent outcome without repeating side effects or disclosing membership.

Tokens must be unpredictable, purpose-bound and tied to the subscriber's current
attempt/generation, with explicit bounded expiry and rotation rules. Store a hash
or safely derived verifier rather than raw reusable bearer secrets. Consumption,
expiry and state/version checks must be atomic under concurrency. Issuing or sending
a confirmation token never makes a subscriber active. Failed/expired confirmation
leaves it unconfirmed until a fresh valid flow completes. Resends are bounded by
abuse controls; transport retries must not create uncontrolled tokens or messages.
Concrete token algorithms, schema and persistence mechanics are #446 work.

Native unsubscribe must commit the operational transition and its deduplicated
withdrawal evidence together using a shared local transaction (or an equivalently
durable recovery design), then acknowledge success. Failure must not acknowledge
an unsubscribe while retaining active state or silently losing evidence. This
native consistency requirement does not make external-provider/local-database
operations a distributed transaction.

### Native mail ownership and failure behavior

Newsletter owns confirmation and unsubscribe intent, link/token semantics,
configurable URL generation, and usable default message content/rendering. Hosts
can customize wording, sender, subject and presentation; they must not need to
author all templates to obtain a usable native implementation. Trusted public URL
configuration supplies origins/routes; link authority uses purpose-bound tokens,
not exposed email addresses, provider secrets or untrusted request origins.

The native infrastructure adapter uses the generic `MailerPort` from
`@anarchitects/common-nest-mailer`. It must not inject `MailerService` or depend
directly on `@nestjs-modules/mailer`. Configure Common transport once at the host
root and reuse its existing `node`/`noop` wiring. No Newsletter-specific SMTP or
API transport duplicates are introduced. No-op mail remains a test/development
choice, not a functioning production double-opt-in implementation.

A send failure leaves grant evidence intact and the subscriber unconfirmed; it
never rolls back consent, activates an address, or silently switches subscriber
providers. A subsequent bounded retry/resend must remain possible. Delivery and
local persistence are not atomic and exactly-once mail delivery is not promised.
Optional unsubscribe-notification failure must not reverse a completed withdrawal.
Public errors remain neutral and must not reveal whether an address already exists.

#447 audits generic transport needs (for example HTML/plain-text alternatives,
`from`, `replyTo` and headers). Any reusable Common Mailer gap requires a separate
issue/PR before the dependent flow merges. Newsletter semantics and templates stay
in Newsletter; ADR-0007 remains authoritative.

### Consent persistence seam and ordering

`ConsentRepositoryPort` owns append operations for grant and withdrawal evidence.
It offers an atomic append-once operation for normalized withdrawals, including native actions and authenticated provider
events, returning recorded/duplicate outcomes without exposing ORM exceptions.

1. Validate affirmative consent and the configured policy version.
2. Persist the grant, including the server-resolved version and wording snapshot,
   email, recording time and permitted source/context evidence.
3. Only after successful persistence, call `SubscriberPort`.
4. A provider failure leaves the grant intact and returns a retryable failure;
   persistence failure prevents the provider call. There is no distributed
   transaction or promise of exactly-once provider delivery.

Ordinary subscription attempts may append separate grants. Retries of the same
native withdrawal or provider event must not append duplicate withdrawals. Grants are not overwritten by withdrawals,
and withdrawals are recorded even if no local grant is known. A withdrawal does not
invent consent wording/version that was never presented.

The persistence adapter enforces deduplication with a durable unique key scoped to
the source and event/action identity. External events include provider/account
scope; native actions use a stable identity for the relevant lifecycle transition.
If a provider lacks a stable event identifier,
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

For the optional MailerLite webhook, HTTP ingress supplies the exact raw request
bytes and signature to the MailerLite adapter. The adapter verifies the HMAC before interpreting provider events or
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
- Hosts may select native or external subscriber implementations and replace
  persistence adapters independently. Native composition needs no external
  subscriber credentials; confirmation/unsubscribe routes belong to native mode.
  MailerLite composition and its webhook route are enabled explicitly; disabling that adapter
  does not expose an unverified webhook or disable a custom subscriber provider.

## Consequences

Newsletter can run subscriber management without a newsletter SaaS and evolve
independently of Blog. The native implementation and optional external adapters
share the application boundary; mail transport is independently replaceable. Consent
evidence remains durable across provider failures; the application can be tested
with fake ports. Hosts retain legal/product ownership and control state lifecycle.

Anarchitects now owns production lifecycle, token, persistence and mail-failure
behavior for native mode, in addition to external adapter correctness. Hosts must
supply explicit storage, transport, public URL and abuse-control configuration.
An external provider call and local persistence are not atomic; operational retry
handling must account for this. The in-memory limiter is convenient for examples
but is not a distributed abuse-control solution. Append-only describes ordinary
grant/withdrawal processing, not an unlimited-retention policy; hosts own authorized
retention/erasure procedures outside these use cases.

## Delivery and validation

#429 established the original architecture; #445 amends it with the first-class
native requirement. This issue delivers documentation only: no persistence schema,
token implementation, templates/delivery, HTTP endpoint or npm publication.

#430 registers packages and boundaries; #431–#437 establish contracts, Nest and
Angular foundations. #446 implements native lifecycle, persistence and token state;
#447 implements native mail flows; #448 adds native HTTP/facade composition. #438
remains last and proves both native and MailerLite modes through examples, OpenAPI,
docs and integration tests. Each child has its own human-created PR. Newsletter
publication waits for #429–#438 and #445–#448 to merge and epic acceptance, followed
by one coordinated release. Fit Over Forty migration follows that release.

Validation must cover the native transition table, expired/rotated/replayed tokens,
concurrent confirm/unsubscribe, fresh consent and confirmation after unsubscribe,
atomic withdrawal/evidence commits, failed-mail recovery and no external-provider
credentials in native mode. Both modes preserve consent-before-subscriber ordering,
stale-policy rejection, failure-retained evidence and anti-enumeration. External
mode additionally proves signed webhook ingress and durable event deduplication.
Keep each limiter mode, scoped Angular state and pre-hydration click/Enter privacy
in the shared acceptance suite. DDD translation preserves the same scenarios.

This amendment introduces no runtime breaking change or package deprecation. It
expands the required native capability and release gate; implementation/API changes
are reviewed in #446–#448 rather than claimed complete by this documentation.

## References

- [ADR-0001: Cross-repository alignment](0001-align-with-bricks-ddd-and-support-migration.md)
- [ADR-0002: Capability-first packaging](0002-do-not-split-libraries-by-audience-until-workflow-divergence-is-real.md)
- [ADR-0004: Common as platform](0004-define-common-as-platform-foundation-not-shared-dumping-ground.md)
- [ADR-0006: Typed domain APIs](0006-forms-must-not-replace-domain-apis.md)
- [ADR-0007: Common Mailer transport boundary](0007-common-mailer-is-transport-only.md)
- [Newsletter DDD alignment](../guides/alignment-with-bricks-ddd.md#newsletter-counterpart-intent)
- [Newsletter migration mapping](../guides/migration-to-bricks-ddd.md#newsletter-migration-mapping)
- [Fit Over Forty reference source at `6280bce`](https://github.com/anarchitects/fitoverforty/tree/6280bce07ee51d78f4bdf5d8235fcc82ea9f7456/libs/newsletter): `subscriber.port.ts`, `newsletter.service.ts`, `withdrawal.service.ts`, `webhook.controller.ts`, and `newsletter-cta.component.ts`. Source comments suggesting future absorption into Forms are not adopted; Newsletter keeps its own capability boundary.
