# ADR 121: Better Auth Persistence Strategy Recommendation

## Status

Accepted

## Context

Issue `#121` asks for a persistence recommendation for the Better Auth direction
under umbrella issue `#106`.

The current repo state is:

- Legacy auth runtime behavior is implemented through `AuthEnginePort`, with
  `legacy-jwt` still the default engine.
- `auth-nest` persistence is TypeORM-backed through `AuthPersistenceModule`,
  `AuthUserRepository`, `UserEntity`, RBAC entities, and invalidated-token
  storage.
- The Better Auth spike intentionally used isolated proof storage and deferred
  production persistence fit to this issue.

Relevant current insertion points:

- [ADR 106](./106-better-auth-spike.md)
- [`AuthPersistenceModule`](../../libs/auth/nest/src/infrastructure-persistence/persistence.module.ts)
- [`TypeormAuthUserRepository`](../../libs/auth/nest/src/infrastructure-persistence/repositories/typeorm-auth-user.repository.ts)

Relevant Better Auth docs:

- Better Auth custom adapter guide:
  https://better-auth.com/docs/guides/create-a-db-adapter
- Better Auth database concepts:
  https://better-auth.com/docs/concepts/database
- Better Auth CLI schema generation:
  https://better-auth.com/docs/concepts/cli

## Decision Options

### Option A: Isolated Better Auth-Owned Persistence

Run Better Auth on its own internal schema/table set and keep the current
TypeORM auth persistence as the legacy JWT store.

Characteristics:

- Better Auth owns its own auth, session, account, verification, and plugin
  storage concerns.
- Current `UserEntity`, RBAC entities, and invalidated-token storage remain the
  legacy JWT persistence model.
- Any future engine coexistence is handled above the persistence layer through
  `AuthEnginePort`, not by forcing one shared table model.

Assessment:

- Implementation complexity: moderate.
- Migration complexity: moderate, because a second persistence shape must be
  introduced and operated alongside the current one.
- Operational fit with current TypeORM usage: acceptable, but it adds a second
  auth store to reason about.
- Maintenance burden: lower than a custom adapter because it follows Better
  Auth’s intended persistence model rather than re-implementing it.
- Coupling risk: low. This option keeps Better Auth table expectations out of
  current TypeORM entities and out of `auth-ts`.
- Public API leakage risk: low, if the store remains internal to `auth-nest`.

Main downside:

- It duplicates auth persistence concerns during the migration window and may
  require explicit account-linking or synchronization decisions later.

### Option B: Custom Better Auth TypeORM Adapter

Build a Better Auth database adapter against TypeORM, first inside this repo,
and consider later extraction to an Anarchitects community adapters/plugins
repository only after it proves stable.

Characteristics:

- Better Auth would persist through a custom adapter layer owned by Anarchitects.
- The adapter could reuse some existing TypeORM infrastructure patterns, but it
  would still need to satisfy Better Auth’s database contract explicitly.
- Reuse of current entities is not automatic; Better Auth-specific entities
  would likely still be required unless the current schema happens to match the
  framework’s persistence expectations closely enough.

Assessment:

- Implementation complexity: high.
- Migration complexity: high, because the adapter contract, schema ownership,
  and compatibility surface would all become local responsibilities.
- Operational fit with current TypeORM usage: strong in the short term because
  it stays on the repo’s current ORM stack.
- Maintenance burden: high. This option turns Anarchitects into the maintainer
  of a Better Auth persistence integration rather than a consumer of one.
- Coupling risk: medium to high. The pressure to reuse current entities would
  make it easier to leak Better Auth persistence assumptions into existing auth
  entities and repositories.
- Public API leakage risk: medium. A custom adapter increases the chance that
  framework persistence concepts influence internal package boundaries over time.

Main upside:

- It preserves a single ORM control plane and could reduce operational split if
  it works cleanly.

Main downside:

- It is a framework-integration product of its own, not just an app-level
  implementation choice.

## Accepted Strategy

Accept a **dual-path Better Auth persistence strategy** for this repo.

Accepted modes:

- `isolated`: isolated Better Auth-owned persistence
- `typeorm-adapter`: custom Anarchitects-owned Better Auth TypeORM adapter

Defaults:

- Default Better Auth persistence mode: `isolated`
- Supported isolated topologies:
  - `same-db`
  - `separate-db`
- Default isolated topology: `same-db`

Reasoning:

- It preserves the architectural goal from `#106`: adopt Better Auth behind the
  existing facades without forcing framework persistence details into the public
  package surface.
- It keeps the cleanest default boundary between current TypeORM legacy JWT
  persistence and future Better Auth persistence concerns.
- It still supports a TypeORM-native Better Auth path for hosts or deployments
  that benefit from a single ORM control plane.
- It aligns with the repo flexibility paradigm by making persistence strategy
  application-layer-abstracted and configuration-driven rather than hardwired.

## Delivery Shape

- The TypeORM adapter starts as an internal implementation in this repo.
- The isolated Better Auth path and the internal TypeORM adapter path are both
  supported follow-on implementation tracks.
- The TypeORM adapter is not public package surface in the first implementation
  phase.
- In parallel, Anarchitects should start work on a community repo path for the
  adapter, but community packaging must follow internal contract proof rather
  than lead it.

## Constraints That Remain Non-Negotiable

- No public `auth-ts` models should be changed to mirror Better Auth tables.
- No public DTO or route contract should become Better Auth persistence-shaped.
- Better Auth persistence must remain internal to `auth-nest`.
- Cross-domain persistence expansion must not be introduced.
- The current `AuthEnginePort` seam remains the runtime boundary.
- Follow-on work should introduce a dedicated application-layer persistence port
  for Better Auth persistence strategy selection so controllers and public
  contracts do not branch on persistence type.

## Consequences For Follow-On Work

- `#123` should finalize ADR 106 with `Conditional GO` and with this dual-path
  persistence strategy as accepted direction.
- Any future implementation issue should add configuration for:
  - Better Auth persistence mode selection
  - isolated topology selection
- Any future implementation issue should add Better Auth migrations/schema as an
  internal persistence concern separate from the current legacy JWT TypeORM
  entities.
- The internal TypeORM adapter should be implemented in this repo first and
  developed in parallel with the community-repo incubation work.
