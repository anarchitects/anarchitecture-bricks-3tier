# ADR 106: Better Auth Spike Behind Auth Facades

## Status

Proposed

## Context

Issue `#106` requires a decision spike to determine whether Better Auth can sit
behind the existing auth domain facades without leaking framework details into:

- `@anarchitects/auth-ts`
- `@anarchitects/auth-nest`
- `@anarchitects/auth-angular`

The current public auth package surface is JWT- and TypeORM-oriented. The spike
must preserve that public surface while creating an internal seam for evaluating:

- password sign-in
- passkey sign-in
- one social provider flow
- sign-out or refresh/session handling

## Decision

For the spike:

1. Keep the current public Nest controller surface unchanged.
2. Introduce an internal `AuthEnginePort` so Better Auth can be evaluated as an
   infrastructure engine rather than a public API.
3. Keep the default engine on `legacy-jwt`.
4. Add an opt-in `better-auth` engine configuration plus spike-only feature
   flags and proof-harness settings.
5. Keep Better Auth internal and non-exported.

## Important Findings Already Reflected In The Spike

- Better Auth is ESM-only.
- `@anarchitects/auth-nest` currently builds as CommonJS.
- The spike therefore uses native dynamic `import()` preservation to keep the
  Better Auth integration internal without forcing a package-format migration.
- Better Auth is session-oriented by default, so mapping current refresh-token
  behavior remains an ADR gate rather than a spike default.

## Persistence Recommendation For The Spike

- Use isolated Better Auth-owned storage for proof execution.
- Do not remap current TypeORM auth entities into Better Auth tables.
- Do not change `auth-ts` models to match Better Auth persistence.
- Treat production persistence fit as a separate decision item under `#121`.

## Route Ownership Recommendation

- Keep package-owned Nest controllers as the canonical public boundary.
- Do not delegate package public `/auth/*` ownership to Better Auth in the spike.
- Evaluate Better Auth through the internal engine seam and proof harness first.

## Go / No-Go Gates

### Go if

- Better Auth can support the targeted flows behind the internal seam.
- Public package APIs remain framework-agnostic.
- The CommonJS package can safely host the ESM-only runtime through the internal
  adapter boundary.

### No-Go if

- Better Auth route conventions or types leak into public package entry points.
- Session semantics cannot be reconciled with the current auth facade contract.
- Persistence requires a coupled rewrite of existing auth entities or public
  shared models.

## Follow-On Work If Go

- Create a separate parent implementation issue/epic.
- Add framework-agnostic DTOs in `auth-ts` for passkeys and social flows.
- Extend Nest presentation/application layers to use the engine seam for real
  package-owned routes.
- Finalize persistence strategy and migrations.
- Update Angular orchestration once the package-owned endpoints stabilize.
