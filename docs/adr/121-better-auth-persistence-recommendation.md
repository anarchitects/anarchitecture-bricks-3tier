# ADR 121: Better Auth Persistence Strategy Recommendation

## Status

Accepted - Aligned to implemented architecture.

## Context

Issue `#121` asked for a persistence recommendation for the Better Auth
direction under umbrella issue `#106`.

The early evaluation considered multiple migration-era persistence options. The
repo has since converged on a settled auth architecture, so this ADR now
records the persistence direction that matches the current implementation rather
than the earlier exploratory options.

The current auth product story is:

- Better Auth is the only built-in internal auth engine
- `auth-nest` remains the public route and integration surface
- core auth is session-first
- TypeORM-backed auth persistence remains internal to `auth-nest`
- core Better Auth tables live in core auth persistence
- plugin-specific tables and migrations stay with their plugin modules

## Accepted Direction

Accept a single internal persistence direction for the current repo:

- Better Auth-backed persistence remains internal to `auth-nest`
- TypeORM remains the repo’s persistence control plane
- the application layer depends on internal seams, not public persistence-mode
  selectors
- public package contracts do not expose Better Auth persistence strategy

In practice, this means:

- core auth persistence owns:
  - `users`
  - `roles`
  - `permissions`
  - `user_roles`
  - `role_permissions`
  - Better Auth-backed core tables such as `accounts`, `sessions`, and
    `verifications`
- plugin-owned persistence stays with plugin modules, for example:
  - JWT invalidation persistence
  - passkey persistence

## Rejected As Current Product Model

The following are no longer the active repo story:

- dual public Better Auth persistence modes
- public persistence-mode selection for consumers
- isolated-vs-adapter topology selection as documented product behavior
- treating a migration-window legacy JWT store as the default runtime model

Those were exploratory evaluation paths, not the settled architecture.

## Non-Negotiable Constraints

- Better Auth persistence must remain internal to `auth-nest`
- no public `auth-ts` models should mirror Better Auth tables
- no public DTO or route contract should become Better Auth-persistence-shaped
- core auth persistence and plugin persistence ownership must stay separated
- package-owned route ownership must remain intact even when runtime behavior is
  Better Auth-backed

## Community Packaging Note

Any future community adapter packaging should follow the proven internal
contract and should not change the product story of this repo.

That means:

- community packaging is secondary to the package-owned auth experience here
- future extraction must not reintroduce public persistence-mode selection into
  this repo
- repo-local docs and tests should continue to describe Better Auth persistence
  as an internal concern of `auth-nest`

## Consequences For Follow-On Work

Follow-on implementation and docs work should:

- describe Better Auth as the only built-in internal engine
- describe auth persistence as internal and TypeORM-backed
- describe core auth as session-first
- describe plugin persistence as plugin-scoped
- avoid documenting multiple active persistence strategies for this repo
