# Migration To `anarchitecture-bricks-ddd`

- Status: Active guide
- Audience: Maintainers planning or executing migration from `anarchitecture-bricks-3tier` to `anarchitecture-bricks-ddd`
- Scope: Domain-by-domain and layer-by-layer migration from 3-tier structure to DDD structure

## Purpose

This guide describes how to migrate capabilities from the 3-tier repo to the DDD repo.

The migration goal is **not** to copy code mechanically. The goal is to preserve domain meaning and public capability while translating the implementation into the more explicit DDD structure.

## Core Principle

Migrate **architecture structure**, not **business meaning**.

A successful migration preserves:

- the same bounded-context/domain intent
- the same or intentionally evolved public language
- the same capability surface where appropriate
- the same example use cases where practical

What changes is the internal structure and separation of responsibilities.

## Canonical Structural Mapping

### Shared TS

From 3-tier:

- `libs/<domain>/ts`

To DDD:

- `libs/<context>/ts/domain`
- `libs/<context>/ts/contracts`

Migration question:

- which parts of the 3-tier TS package are business model concerns?
- which parts are transport/public schema concerns?

### Nest

From 3-tier:

- `libs/<domain>/nest`

To DDD:

- `libs/<context>/nest/application`
- `libs/<context>/nest/presentation`
- `libs/<context>/nest/infrastructure-*`
- `libs/<context>/nest/facade`

Migration question:

- which code is orchestration/use-case logic?
- which code is controller/presentation?
- which code is persistence/integration adapter logic?
- which code is easy-mode composition?

### Angular

From 3-tier:

- `libs/<domain>/angular`

To DDD:

- `libs/<context>/angular/ui`
- `libs/<context>/angular/feature`
- `libs/<context>/angular/state`
- `libs/<context>/angular/data-access`
- `libs/<context>/angular/facade`

Migration question:

- which code is presentational?
- which code is smart composition?
- which code is state/orchestration?
- which code is transport/integration?

## Recommended Migration Sequence

### Step 1: confirm the target bounded context

Before migrating, confirm that the 3-tier domain maps cleanly to one target bounded context in the DDD repo.

If not, decide whether:

- the 3-tier domain should split into multiple bounded contexts
- the 3-tier domain should remain one bounded context with cleaner internal boundaries

### Step 2: split TS concerns first

Start by separating:

- domain meaning
- public transport/contracts

This is usually the most important structural change because the DDD repo treats those as separate first-class packages.

### Step 3: extract Nest layer responsibilities

Inside the 3-tier Nest package, identify:

- application/use-case logic
- presentation/controller concerns
- infrastructure adapters
- facade/composition logic

Move these into the DDD Nest package family.

### Step 4: extract Angular layer responsibilities

Inside the 3-tier Angular package, identify:

- `ui`
- `feature`
- `state`
- `data-access`
- `facade`

Do not migrate the Angular package as one undifferentiated unit.

### Step 5: preserve public capability parity

After the structural migration, verify that the target DDD packages still represent the same domain capability intentionally.

### Step 6: validate with comparable examples

Use or create example flows that prove the migrated DDD bounded context still supports the equivalent use cases.

## Incremental Migration Strategy

Preferred strategy:

- migrate one domain/bounded context at a time
- migrate TS meaning/contracts first
- migrate Nest and Angular in slices
- keep both repos documented during overlap

Avoid trying to rewrite the whole repo family in one move.

## Practical Checklist

For each migrating domain, answer:

1. What is the target bounded-context name in the DDD repo?
2. What in `libs/<domain>/ts` becomes `ts/domain`?
3. What in `libs/<domain>/ts` becomes `ts/contracts`?
4. Which Nest code becomes `application`?
5. Which Nest code becomes `presentation`?
6. Which Nest code becomes `infrastructure-*`?
7. Which Angular code becomes `ui`, `feature`, `state`, and `data-access`?
8. Which example use cases prove parity after migration?

## Safe Migration Heuristics

A 3-tier domain is a good candidate for DDD migration when:

- business rules are becoming harder to isolate
- DTO/schema concerns are mixed with domain meaning
- Nest code is carrying multiple responsibilities in one package
- Angular code is growing into a clear `ui`/`feature`/`state`/`data-access` split anyway
- teams want more explicit ports/adapters and composition boundaries

## Anti-Patterns

Avoid:

- copying the 3-tier TS package unchanged into `ts/domain`
- moving all Nest code into one DDD layer and calling it migrated
- moving all Angular code into `feature` and leaving `ui`/`state`/`data-access` empty
- renaming without separating responsibilities
- allowing the two repos to drift during migration without documenting equivalence

## Newsletter Migration Mapping

This is the intended mapping for the Newsletter architecture and #445 native amendment in
[ADR-0010](../adr/0010-define-newsletter-domain-boundaries-and-ports.md). Paths below
are planned responsibilities, not installed packages or a migration command. The
DDD counterpart remains future work; see its [alignment status](./alignment-with-bricks-ddd.md#newsletter-counterpart-intent).

| 3-tier responsibility                                                                | Expected DDD destination                                   | Preserve                                                                                                                               |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `libs/newsletter/ts`: consent policy/version, lifecycle and grant/withdrawal meaning | `libs/newsletter/ts/domain`                                | Lifecycle transitions and consent invariants, without transport schemas                                                                |
| `libs/newsletter/ts`: request/response DTOs and route schemas                        | `libs/newsletter/ts/contracts`                             | Public validation and provider-neutral HTTP contracts                                                                                  |
| Nest `application`                                                                   | `libs/newsletter/nest/application`                         | Subscribe/confirm/unsubscribe use cases, neutral subscriber/state/evidence ports, ordering and idempotency                             |
| Nest `presentation`                                                                  | `libs/newsletter/nest/presentation`                        | Native confirm/unsubscribe and optional webhook ingress, neutral HTTP mapping and abuse controls                                       |
| Nest `infrastructure-persistence`                                                    | `libs/newsletter/nest/infrastructure-persistence`          | Separate operational subscriber/token state and append-only evidence; atomic transitions and durable deduplication                     |
| Nest `infrastructure-native`                                                         | `libs/newsletter/nest/infrastructure-native`               | Native subscriber adapter, token primitives and mail/persistence composition, without moving lifecycle rules out of domain/application |
| Nest `infrastructure-mailerlite`                                                     | `libs/newsletter/nest/infrastructure-mailerlite`           | Optional provider API integration, raw-body verification and event normalization                                                       |
| Nest config and root module                                                          | Target config surface and `libs/newsletter/nest/facade`    | Explicit native/external selection, independent transport/persistence, overrides and both initialization paths                         |
| Angular `ui`, `feature`, `state`, `data-access`                                      | Corresponding `libs/newsletter/angular/<layer>` packages   | Layer direction, explicit state providers, accessible hydration-safe signup                                                            |
| Angular config and root exports                                                      | Target config surface and `libs/newsletter/angular/facade` | Host-supplied policy/copy/routes and easy composition                                                                                  |

Native lifecycle rules belong in the DDD domain/application surfaces; the native
infrastructure package adapts ports and composes technical capabilities. The native
entry point and associated state/token seams are planned responsibilities for
#446–#448, not a claim that either repository already exports them. Newsletter owns
confirmation/unsubscribe message intent and default rendering in either style;
Common `MailerPort` owns delivery. Newsletter must use that port instead of
injecting `MailerService`; its business templates stay inside Newsletter.

Migrate meaning and contracts first, then application ports, adapters and facades,
and finally Angular composition. Keep provider payloads and ORM entities out of TS
domain/contracts. A package split alone must not rewrite stored consent evidence,
change policy versions or reset event deduplication keys. If storage/schema changes
are needed, prepare an explicit data migration preserving event identity and history.
Also preserve operational status, token purpose/expiry/generation, consumed-token
semantics, and withdrawal/transition consistency. Never derive active subscriber
state from consent rows alone. If outstanding secure links cannot survive a token
format/key change, explicitly invalidate and reissue through a bounded flow;
never activate addresses or discard opt-outs to simplify migration.

Switching native/external implementations is a separate reconciliation decision.
Do not enable implicit dual writes or fallback, assume an external provider's state
matches native rows, or import historical consent as proof of confirmation.

Validate both styles and provider modes with equivalent examples: native operation
with no MailerLite credentials; new pending subscription, confirmation and
unsubscribe; repeated/concurrent actions; expired, rotated and replayed tokens;
fresh consent and confirmation after unsubscribe; failed-mail retry without
activation; atomic native withdrawal/evidence persistence; external double opt-in;
existing-address anti-enumeration; stale-policy rejection; evidence persistence
before provider invocation and retention after provider failure; withdrawal without
a local grant; concurrent duplicate webhook delivery; invalid signatures or missing
raw bytes causing no writes; retry after persistence failure; explicit shared,
single-instance and disabled limiter modes; isolated frontend state; and click/Enter
before hydration causing no email-bearing GET navigation.

Keep exact consent wording, privacy content, CTA copy, access policy and Blog page
composition in the consumer throughout migration. Document any intentional capability
divergence in both repositories before claiming parity.

## Related

- [Guide: Alignment With `anarchitecture-bricks-ddd`](./alignment-with-bricks-ddd.md)
