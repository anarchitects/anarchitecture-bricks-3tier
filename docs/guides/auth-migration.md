# Auth Migration Guide

## Intent

This guide is the single source of truth for migrating onto the current Better Auth-backed auth architecture in this repository.

The product story is now explicit:

- `@anarchitects/auth-nest` is the public auth product surface
- Better Auth is the canonical internal auth engine
- core auth is session-first
- JWT, passkeys, social auth, and future authn methods are plugin-scoped extensions

## Architecture Shift

### Better Auth is internal, not the public API

Do not treat raw Better Auth handlers, tables, or adapter types as the primary contract of the auth domain.

The public contracts stay package-owned:

- shared DTOs and models in `@anarchitects/auth-ts`
- Angular browser-facing integration in `@anarchitects/auth-angular`
- Nest routes, composition, and orchestration in `@anarchitects/auth-nest`

### Core auth is session-first

The default/core auth surface now assumes cookie-backed session flows:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/verify-email`
- `PATCH /auth/update-email/:userId`
- `PATCH /auth/activate`

Treat `/auth/login` and `/auth/logout` as Better Auth-backed session routes, not JWT token routes.

### JWT is plugin-scoped

JWT remains supported, but only as an optional plugin-owned surface:

- `POST /auth/jwt/login`
- `POST /auth/jwt/logout`
- `POST /auth/jwt/refresh`

Use JWT-specific import paths and route expectations only when the JWT plugin is enabled.

## What Changed

### Shared model contract changes

These auth-domain naming changes are now canonical:

- `userName` -> `name`
- `isActive` -> `emailVerified`

`User.passwordHash` is gone from the shared model. Credential passwords now live in `auth.accounts`.

### Persistence ownership changes

Core auth persistence is now split like this:

- `auth.users` remains the canonical package-owned user table
- core Better Auth tables live in core auth persistence:
  - `accounts`
  - `sessions`
  - `verifications`
- plugin-specific tables stay with their plugin modules:
  - `passkeys` stays with the passkeys plugin
  - JWT invalidation persistence stays with the JWT plugin

Do not assume password state lives on `users`. The credential account row is the canonical password source.

### Better Auth 1.7 and TypeORM 1.1 persistence upgrade

This is a breaking persistence upgrade. Consumers must use:

- Node.js `^20.19.0 || ^22.13.0 || >=24.11.0`
- Better Auth and `@better-auth/passkey` `~1.7.2`
- `@anarchitects/better-auth-typeorm-adapter` `0.2.0`
- TypeORM `^1.1.0` and `@nestjs/typeorm` `^11.0.1`

Better Auth 1.7 derives provider-ID identities through its built-in issuer
strategy. Credential accounts use `local:credential`; OAuth accounts without a
trusted issuer use `local:oauth:${encodeURIComponent(providerId)}`. Better Auth
1.7.2 does not expose an `account.identityStrategy` configuration property, so
hosts must not add that unsupported option.

Apply `AddBetterAuthAccountIssuer1788275931000` after the previously published
core auth schema migration and before starting application instances running
Better Auth 1.7. The migration adds and backfills `auth.accounts.issuer`, rejects
invalid or colliding legacy identities, replaces uniqueness on
`(providerId, accountId)` with `(issuer, accountId)`, and finally makes `issuer`
required. Existing schema migrations are intentionally not rewritten.

Plan a maintenance window for the database change:

1. Stop auth writes and take a verified database backup.
2. Check that every account has a non-empty `providerId` and that the derived
   `(issuer, accountId)` pairs are unique.
3. Upgrade Node, Better Auth, the adapter, TypeORM, and Nest TypeORM together.
4. Apply core auth migrations in order, then passkey and other plugin migrations.
5. Deploy the application only after the migration succeeds and verify register,
   login, session, logout, passkey initialization, and JWT persistence.

The rollback is guarded: it refuses to restore the old uniqueness rule if
duplicate `(providerId, accountId)` rows exist. If rollback is required, stop
writes, restore application packages first, run the guarded migration rollback,
and restore the backup if its preconditions cannot be met.

TypeORM 1 no longer accepts the legacy nested string relation syntax used by
older repository calls; use relation objects and public `DataSource`, repository,
query-builder, entity, and migration APIs. Audit queries that pass `null` or
`undefined` explicitly—their filtering behavior changed—and do not rely on
removed internal APIs.

The adapter changed license from MIT to Apache-2.0 in `0.2.0`; downstream
dependency and attribution reviews should record that change. See the official
[Better Auth 1.7 upgrade guide](https://better-auth.com/docs/guides/1-7-upgrade-guide)
and [TypeORM 1.0 upgrade guide](https://dev.typeorm.io/docs/releases/1.0/upgrading-from-0.3/).

FitOverForty is the named downstream coordination case. Its host dependency
upgrade must align Better Auth, the adapter, TypeORM, and Nest TypeORM, but its
application source changes are intentionally outside this repository change.

### Config and environment changes

Canonical auth config now lives under:

- `betterAuth.*` for core engine settings
- `plugins.jwt.*`
- `plugins.passkeys.*`
- `plugins.social.*`
- `plugins.oidc.*`

Canonical environment variable names use the `AUTH_PLUGIN_*` and `AUTH_BETTER_AUTH_*` families.

The current product story does not expose a public engine-selection or
Better Auth persistence-mode switch. Better Auth and its database integration
remain internal implementation details of `auth-nest`.

Legacy env aliases may still be tolerated for compatibility in some places, but they are no longer the documented or preferred configuration surface.

## Import Path Migration

### Shared DTOs

Core/session DTOs stay on the root DTO entrypoint:

```ts
import { LoginRequestDTO, LoggedInUserInfoResponseDTO, LogoutRequestDTO } from '@anarchitects/auth-ts/dtos';
```

JWT DTOs moved to the JWT subpath:

```ts
import { JwtLogoutRequestDTO, LoginResponseDTO, RefreshTokenRequestDTO, RefreshTokenResponseDTO } from '@anarchitects/auth-ts/dtos/jwt';
```

Do not import JWT DTOs from `@anarchitects/auth-ts/dtos`.

### Angular entrypoints

Core session-first entrypoints stay on the root layer paths:

- `@anarchitects/auth-angular/config`
- `@anarchitects/auth-angular/data-access`
- `@anarchitects/auth-angular/state`
- `@anarchitects/auth-angular/feature`
- `@anarchitects/auth-angular/ui`
- `@anarchitects/auth-angular/util`

JWT-specific Angular code moved behind plugin subpaths:

- `@anarchitects/auth-angular/data-access/jwt`
- `@anarchitects/auth-angular/state/jwt`
- `@anarchitects/auth-angular/feature/jwt`
- `@anarchitects/auth-angular/ui/jwt`

Feature JWT orchestration must go through `@anarchitects/auth-angular/state/jwt`, not `data-access/jwt` directly.

### Nest routing expectations

Before:

- core login/logout flows were often treated as JWT-first
- legacy engine selection and JWT-first assumptions influenced docs and examples

Now:

- `/auth/login` and `/auth/logout` are the default session routes
- `/auth/jwt/*` exists only when the JWT plugin is enabled
- Better Auth powers the runtime internally, while `auth-nest` keeps route ownership

## Migration Checklist

Use this checklist when updating consumers or example apps:

1. Replace `userName` with `name`.
2. Replace `isActive` with `emailVerified`.
3. Stop expecting `User.passwordHash`.
4. Move JWT DTO imports to `@anarchitects/auth-ts/dtos/jwt`.
5. Move JWT Angular code to the `data-access/jwt`, `state/jwt`, `feature/jwt`, or `ui/jwt` subpaths.
6. Treat `/auth/login` and `/auth/logout` as session routes.
7. Treat `/auth/jwt/*` as optional plugin routes only.
8. Use canonical `AUTH_BETTER_AUTH_*` and `AUTH_PLUGIN_*` env vars.
9. Stop documenting or expecting multiple built-in auth engines.
10. Upgrade the Better Auth/adapter/TypeORM stack together and apply
    `AddBetterAuthAccountIssuer1788275931000` before restarting auth writes.

## Defaults And Assumptions

- Better Auth is the only built-in internal auth engine.
- Email/password is always enabled in core auth.
- JWT is optional and disabled by default.
- Passkeys, social auth, and OIDC are optional and plugin-scoped.
- `auth-nest` owns the public route and integration experience.
