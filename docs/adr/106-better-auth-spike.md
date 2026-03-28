# ADR 106: Better Auth Decision Record Behind Auth Facades

## Status

Accepted - Implemented.

## Context

Issue `#106` asked whether Better Auth could sit behind the existing auth domain
facades without leaking framework details into:

- `@anarchitects/auth-ts`
- `@anarchitects/auth-nest`
- `@anarchitects/auth-angular`

The spike started as an evaluation, not as a promise to expose Better Auth
directly. The success criteria were always:

- keep package-owned DTOs, models, and routes as the public contract
- keep Nest route ownership in `auth-nest`
- keep Angular consumption aligned to package-owned APIs
- keep Better Auth internal to the auth domain

## Final Outcome

Better Auth is a viable internal engine behind the auth facades, and the repo
has since settled on that architecture.

The implemented product story is now:

- Better Auth is the only built-in internal auth engine
- `@anarchitects/auth-nest` remains the public route and integration surface
- core auth is session-first
- email/password is always enabled in core auth
- repo-owned RBAC remains layered on top of Better Auth-backed user/session
  state
- JWT, passkeys, social auth, and future authn capabilities are package-owned,
  plugin-scoped extensions

## Conclusions That Remain Canonical

### Route ownership

- Keep package-owned Nest controllers as the canonical public HTTP boundary
- Do not delegate public `/auth/*` ownership directly to raw Better Auth
  handlers
- Better Auth runtime handling may sit behind the presentation layer, but it is
  not the public API

### Public contract containment

- Better Auth remains internal to `auth-nest`
- Public DTOs, shared models, and Angular-facing APIs remain package-owned
- Better Auth types, route conventions, session models, and database concerns
  must not become public package contract

### Package boundaries

- `auth-ts` remains the source of truth for package-owned DTOs and models
- `auth-angular` remains the browser-facing integration surface
- `auth-nest` owns route composition, orchestration, configuration, and
  framework integration

## Persistence Direction

The current repo no longer treats Better Auth persistence as a public
mode-selection story.

The settled implementation direction is:

- Better Auth persistence remains internal to `auth-nest`
- core Better Auth-backed tables are owned by core auth persistence
- plugin-specific tables, entities, and migrations stay with their plugin
  modules
- the application layer depends on internal seams rather than exposing
  persistence strategy selection as public package API

See [ADR 121](./121-better-auth-persistence-recommendation.md) for the aligned
persistence decision record.

## Historical Note

The spike phase explored transitional ideas such as alternate engine defaults,
multiple Better Auth persistence modes, and migration-window coexistence
strategies.

Those spike-era options are not the current product story anymore.

They should be treated as historical exploration only, not as active
documentation for the auth domain.

## Stop Conditions That Still Matter

Treat the Better Auth direction as failed if any of the following become true
in future follow-on work:

- Better Auth types, routes, or persistence concerns leak into public package
  APIs
- package-owned route ownership is lost
- shared/public DTOs are reshaped around Better Auth internals
- plugin-specific persistence bleeds back into core auth ownership
- session-first core auth becomes ambiguous again at the package surface

## Implementation Implications

Follow-on work should preserve the implemented architecture rather than
reopening the spike.

That means:

- keep Better Auth as the only built-in internal engine
- keep session-first behavior as the default/core auth story
- keep plugin authn capabilities explicitly optional and package-scoped
- keep public documentation and tests aligned to package-owned contracts rather
  than raw Better Auth behavior
