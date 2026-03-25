# ADR 106: Better Auth Decision Record Behind Auth Facades

## Status

Accepted - Conditional GO.

## Context

Issue `#106` asked whether Better Auth can sit behind the existing auth domain
facades without leaking framework details into:

- `@anarchitects/auth-ts`
- `@anarchitects/auth-nest`
- `@anarchitects/auth-angular`

The repo entered this work with:

- a public auth surface that is JWT- and TypeORM-oriented,
- Nest-owned `/auth/*` routes,
- TypeORM-backed auth persistence,
- and no internal seam for evaluating an alternate auth engine.

The goal of the spike was not full migration. The goal was to determine whether
Better Auth is a viable internal engine candidate behind the existing package
facades.

## Outcomes Already Achieved

The spike and follow-on sub-issues established the following:

### Internal engine seam

- Better Auth can be evaluated behind an internal `AuthEnginePort`.
- The application layer now depends on the internal engine seam rather than
  binding the entire auth flow directly to the legacy JWT runtime.
- `legacy-jwt` remains the default engine and active runtime path.

### Public API containment

- Public package APIs remained framework-agnostic during the spike and adapter
  boundary work.
- Package-owned Nest controllers remain the canonical public HTTP boundary.
- Better Auth types, route ownership, and persistence schema were not exposed
  through public package entry points.

### Packaging/runtime constraints

- Better Auth is ESM-only.
- `@anarchitects/auth-nest` currently builds as CommonJS.
- The repo proved that Better Auth can be hosted internally through preserved
  native dynamic `import()` without forcing a package-format migration during
  the spike.

### Persistence strategy

- Persistence fit was analyzed separately in [ADR 121](./121-better-auth-persistence-recommendation.md).
- The accepted model is configuration-driven and abstracted behind an
  application-layer persistence port.
- Supported Better Auth persistence modes are:
  - `isolated`
  - `typeorm-adapter`
- The default Better Auth persistence mode is `isolated`.
- The `isolated` mode supports both:
  - `same-db`
  - `separate-db`
- The default isolated topology is `same-db`.

## Decision Outcome

- Final outcome: `Conditional GO`

Rationale for the final outcome:

- Better Auth appears viable as an internal engine candidate behind
  `AuthEnginePort`.
- Public package APIs remained framework-agnostic through the spike and
  boundary work.
- The remaining concerns are implementation constraints, not spike failure:
  configuration-driven persistence composition, session-vs-JWT mapping
  decisions, and continued public API containment.

## Finalized Conclusions

### Route ownership

- Keep package-owned Nest controllers as the canonical public boundary.
- Do not delegate package public `/auth/*` ownership directly to Better Auth.
- Any future Better Auth runtime handling should remain wrapped behind the
  package-owned presentation layer where practical.

### Public contract containment

- Better Auth must remain internal to `auth-nest`.
- Public DTOs, shared models, and Angular-facing APIs must remain
  framework-agnostic.
- Better Auth route conventions, session models, and persistence schema must
  not become public package contract.

### Persistence direction

- Better Auth remains internal to `auth-nest`.
- Better Auth persistence must remain abstracted behind an application-layer
  port.
- Persistence mode is configuration-driven.
- Supported Better Auth persistence modes are:
  - `isolated`
  - `typeorm-adapter`
- Default Better Auth persistence mode: `isolated`.
- Supported isolated topologies are:
  - `same-db`
  - `separate-db`
- Default isolated topology: `same-db`.
- The custom TypeORM adapter starts as an internal repo implementation and may
  later be extracted to an Anarchitects community repo once the contract and
  maintenance shape are stable.
- Current TypeORM legacy JWT persistence remains the default and should not be
  remapped to Better Auth tables by default.

## Stop Conditions

Treat the Better Auth direction as failed if any of the following become true in
follow-on implementation:

- Better Auth types, routes, or persistence concerns leak into public package
  APIs.
- Isolated Better Auth persistence cannot remain internal to `auth-nest`.
- The migration path requires coupling current public/shared models to Better
  Auth schema.
- Route delegation prevents stable package docs or contract generation.
- Session semantics cannot be reconciled with the package surface without
  destabilizing the public auth contract.

## Implementation Implications

If the final outcome is `GO` or `Conditional GO`:

- Create a separate follow-on implementation parent issue/epic.
- Create a separate parallel parent issue for Anarchitects community Better
  Auth integrations.
- Keep `legacy-jwt` as the default engine until that follow-on implementation
  lands and is explicitly approved.
- Treat passkeys, social flows, DTO additions, Better Auth persistence tables,
  Angular integration, and docs/contract updates as follow-on work.
- When `engine=better-auth`, default the persistence mode to `isolated`.
- When `engine=better-auth` and `persistence.mode=isolated`, default the
  topology to `same-db`.
- Support the internal TypeORM adapter in parallel as a configuration-driven
  Better Auth persistence mode, while incubating its extraction path in the
  community repo track.

If the final outcome is `NO-GO`:

- Do not proceed with Better Auth implementation beyond the completed spike and
  seam work.
- Keep the repo on the `legacy-jwt` engine path.
- Treat the completed spike/boundary work as closed evaluation effort rather
  than migration start.
