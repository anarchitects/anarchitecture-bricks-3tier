# ADR 121: Better Auth Persistence Strategy Recommendation

## Status

Proposed

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

## Constraints That Must Hold For Either Option

- No public `auth-ts` models should be changed to mirror Better Auth tables.
- No public DTO or route contract should become Better Auth persistence-shaped.
- Better Auth persistence must remain internal to `auth-nest`.
- Cross-domain persistence expansion must not be introduced.
- The current `AuthEnginePort` seam remains the runtime boundary; persistence
  decisions must not bypass it by coupling controllers or public contracts to a
  storage model.

## Recommendation

Recommend **Option A: isolated Better Auth-owned persistence** as the preferred
path for this repo.

Reasoning:

- It best matches the architectural goal from `#106`: evaluate and potentially
  adopt Better Auth behind the existing facades without forcing framework
  internals into the public package surface.
- It avoids turning Anarchitects into the maintainer of a Better Auth
  infrastructure product before Better Auth has even been adopted as a runtime
  engine in production/package behavior.
- It preserves the cleanest boundary between:
  current TypeORM legacy JWT persistence, and
  future Better Auth persistence concerns.
- It keeps the future go/no-go decision in `#123` focused on product fit, not
  on whether Anarchitects is willing to own a long-term custom adapter.

## Fallback Path

Keep **Option B: custom Better Auth TypeORM adapter** as the explicit fallback.

Reconsider the custom adapter path only if one or more of these become true:

- isolated Better Auth persistence creates unacceptable operational complexity
  for host applications,
- the migration path requires strong TypeORM-native control that Better Auth’s
  intended persistence model does not provide cleanly,
- or a single-ORM operational model is judged more important than minimizing
  framework-specific maintenance ownership.

If that fallback is chosen later:

- implement it first as an internal adapter in this repo,
- require proof that current entities can be reused safely or document which new
  Better Auth-specific entities are still required,
- and treat extraction to a separate Anarchitects community adapter/plugin repo
  as a later packaging decision, not part of `#121`.

## Consequences For Follow-On Work

- `#123` should treat isolated Better Auth-owned persistence as the default
  recommendation when finalizing the go/no-go ADR.
- Any future implementation issue should add Better Auth migrations/schema as an
  internal persistence concern separate from the current legacy JWT TypeORM
  entities.
- If the custom TypeORM adapter path is ever selected, it should be scoped as a
  distinct implementation stream with explicit ownership and maintenance costs,
  not folded into generic Better Auth adoption work.
