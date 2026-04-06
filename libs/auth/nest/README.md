# @anarchitects/auth-nest

NestJS services, controllers, and infrastructure for the Anarchitecture authentication domain. This package wires contract-driven DTOs from `@anarchitects/auth-ts`, uses Better Auth as the canonical internal auth engine, keeps email/password always enabled, and layers repo-owned RBAC on top of Better Auth-backed user/session state.

Migration guidance for the Better Auth realignment lives in the [auth migration guide](../../../docs/guides/auth-migration.md).

## Developer + AI Agent Start Here

- Read this README before generating integration code for `@anarchitects/auth-nest`.
- Start with `AuthModule.forRoot(...)` or `AuthModule.forRootFromConfig(...)` from the root entry point unless you need explicit layered composition.
- Keep shared mail transport setup at app root via `@anarchitects/common-nest-mailer`; keep auth mailer infrastructure adapter-only.
- Use DTO contracts from `@anarchitects/auth-ts` and preserve `presentation -> application <- infrastructure` boundaries.

## Features

- **Application layer** – Better Auth-backed `AuthService`, `BcryptHashService`, CASL-based `PoliciesService`, and `AbilityFactory` encapsulating business rules for sessions, passwords, and fine-grained access control.
- **Presentation layer** – `AuthController` exposing the package-owned core session-oriented auth lifecycle, `PoliciesGuard` and `@Policies()` decorator for route-level authorization, plus internal plugin controllers such as JWT when enabled.
- **Infrastructure persistence** – TypeORM entities and repositories for users, roles, permissions, and core Better Auth tables in the `auth` schema. Better Auth database operations are bridged internally through the published `@anarchitects/better-auth-typeorm-adapter`, while this repo keeps the Nest wrapper, entity registration, and migrations local. Plugin-specific tables and plugin-owned persistence such as JWT invalidation stay with their plugin modules.
- **Infrastructure mailer** – `AuthMailerModule` wrapper over shared `CommonMailerModule.forRoot(...)` provider wiring; `NodeMailerAdapter` is re-exported for compatibility.
- **Config** – Typed `authConfig` namespace using `@nestjs/config` with a Better Auth core config branch and typed plugin configuration.

## Installation

```bash
npm install @anarchitects/auth-nest @nestjs/common @nestjs/config @nestjs/core @nestjs/jwt @nestjs/platform-fastify @nestjs/typeorm typeorm
# or
yarn add @anarchitects/auth-nest @nestjs/common @nestjs/config @nestjs/core @nestjs/jwt @nestjs/platform-fastify @nestjs/typeorm typeorm
```

Peer requirements:

- `@nestjs/common`, `@nestjs/core`, `@nestjs/jwt`, `@nestjs/typeorm`, `@nestjs/config`
- `@nestjs/platform-fastify`, `typeorm`

The internal `@anarchitects/auth-ts` and `@anarchitects/common-nest-mailer` packages are installed transitively. The published community package `@anarchitects/better-auth-typeorm-adapter` is also installed transitively and used internally by `@anarchitects/auth-nest`; consumers do not need to wire it directly when using this package facade. Runtime utilities such as `@casl/ability`, `bcrypt`, `better-auth`, and `@better-auth/passkey` are direct dependencies of this package. Add `@nestjs-modules/mailer` only when your host app enables the shared/common mailer integration.

## Better Auth Adapter Boundary

`@anarchitects/auth-nest` now consumes the published `@anarchitects/better-auth-typeorm-adapter` package internally for Better Auth database composition.

- The community package provides only the framework-neutral Better Auth `database` adapter.
- This repo still owns the Nest wrapper, dependency injection, TypeORM entities, migrations, and plugin model registration.
- This internal swap does not add a new public Nest API or change the existing `AuthModule` / `AuthApplicationModule` integration surface.

Maintainers can validate the published npm artifact integration path with:

```bash
yarn nx run auth-nest:test-published-adapter
```

That target boots `auth-nest` against ephemeral PostgreSQL and exercises the real published adapter package through the host repo's Nest integration path. It requires Docker or another supported local container runtime because the suite provisions PostgreSQL through `testcontainers`.

## Exports

| Import path                                          | Contents                                                                                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@anarchitects/auth-nest`                            | `AuthModule.forRoot(...)`, `AuthModule.forRootFromConfig(...)`, plus re-exports of layered entry points for convenience                                                      |
| `@anarchitects/auth-nest/application`                | `AuthApplicationModule`, `AuthService`, `HashService`, `BcryptHashService`, `PoliciesService`, `AbilityFactory`, resource-authorization helpers/types                        |
| `@anarchitects/auth-nest/presentation`               | `AuthPresentationModule`, `AuthController`, `PoliciesGuard`, `ResourceAuthorizationGuard`, `@Policies()`, `@AuthorizeResource()`, `@AuthorizedResource()`, `RoutePolicy`     |
| `@anarchitects/auth-nest/infrastructure-persistence` | `AuthPersistenceModule`, core auth persistence entities, `CreateAuthSchema1720200000000`, `AuthAccountRepository`, `AuthUserRepository`, and persistence module option types |
| `@anarchitects/auth-nest/infrastructure-mailer`      | `AuthMailerModule`, `NodeMailerAdapter`                                                                                                                                      |
| `@anarchitects/auth-nest/config`                     | `authConfig`, `AuthConfig` type, `InjectAuthConfig()`                                                                                                                        |

## Wiring Migrations And Entities

Prefer symbol imports from `@anarchitects/auth-nest/infrastructure-persistence` when wiring TypeORM `DataSource` migrations or host-level entity registration. This gives consumers a stable public contract instead of depending on package-internal file paths.

Recommended:

```ts
import { AccountEntity, CreateAuthSchema1720200000000, PermissionEntity, RoleEntity, SessionEntity, UserEntity, VerificationEntity } from '@anarchitects/auth-nest/infrastructure-persistence';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  migrations: [CreateAuthSchema1720200000000],
  entities: [AccountEntity, PermissionEntity, RoleEntity, SessionEntity, UserEntity, VerificationEntity],
});
```

Legacy glob-based wiring still works, but it depends on package internals and is not the recommended integration path:

```ts
import { join } from 'node:path';

export const AppDataSource = new DataSource({
  type: 'postgres',
  migrations: [join(process.cwd(), 'node_modules/@anarchitects/auth-nest/src/infrastructure-persistence/migrations/*.js')],
});
```

Use the symbol-based approach for production apps and reusable templates. Keep plugin-specific migrations with their owning plugin modules; the `infrastructure-persistence` entry point only exposes the core auth schema migration.

## Configuration

The library reads configuration through `@nestjs/config` using a namespaced `authConfig` registered under the key `auth`. Set the following environment variables to customise behaviour:

| Variable                                       | Description                                                             | Default                               |
| ---------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------- |
| `AUTH_BETTER_AUTH_BASE_URL`                    | Better Auth base URL used for internal route generation.                | `http://localhost:3000/api/auth`      |
| `AUTH_BETTER_AUTH_SECRET`                      | Better Auth secret. **Must** be overridden in production.               | `better-auth-secret-32-chars-minimum` |
| `AUTH_BETTER_AUTH_VERIFY_EMAIL_CALLBACK_URL`   | App-facing callback URL embedded in verification emails.                | `<base-url origin>/verify-email`      |
| `AUTH_BETTER_AUTH_RESET_PASSWORD_CALLBACK_URL` | App-facing callback URL embedded in password reset emails.              | `<base-url origin>/reset-password`    |
| `AUTH_PLUGIN_JWT_ENABLED`                      | Enables the internal JWT plugin routes.                                 | `false`                               |
| `AUTH_PLUGIN_JWT_SECRET`                       | Secret key used by the JWT plugin. **Must** be overridden when enabled. | `default_jwt_secret`                  |
| `AUTH_PLUGIN_JWT_EXPIRATION`                   | JWT plugin token lifetime (e.g. `3600s`, `15m`, `1d`).                  | `3600s`                               |
| `AUTH_PLUGIN_JWT_AUDIENCE`                     | Expected `aud` claim for JWT plugin tokens.                             | `your_audience`                       |
| `AUTH_PLUGIN_JWT_ISSUER`                       | Expected `iss` claim for JWT plugin tokens.                             | `your_issuer`                         |
| `AUTH_PLUGIN_PASSKEYS_ENABLED`                 | Enables the passkeys plugin.                                            | `false`                               |
| `AUTH_PLUGIN_PASSKEY_RP_ID`                    | Passkey relying-party ID.                                               | `localhost`                           |
| `AUTH_PLUGIN_PASSKEY_RP_NAME`                  | Passkey relying-party display name.                                     | `Anarchitecture Auth`                 |
| `AUTH_PLUGIN_PASSKEY_ORIGIN`                   | Explicit passkey origin when needed.                                    | unset                                 |
| `AUTH_PLUGIN_SOCIAL_ENABLED`                   | Enables social auth plugins.                                            | `false`                               |
| `AUTH_PLUGIN_SOCIAL_GITHUB_CLIENT_ID`          | GitHub social sign-in client ID.                                        | unset                                 |
| `AUTH_PLUGIN_SOCIAL_GITHUB_CLIENT_SECRET`      | GitHub social sign-in client secret.                                    | unset                                 |
| `AUTH_PLUGIN_OIDC_ENABLED`                     | Enables future OIDC plugin wiring.                                      | `false`                               |
| `AUTH_ENCRYPTION_ALGORITHM`                    | Password hashing algorithm (`bcrypt`).                                  | `bcrypt`                              |
| `AUTH_ENCRYPTION_KEY`                          | Symmetric key for additional encryption needs. **Must** be overridden.  | `default_encryption_key`              |
| `AUTH_MAILER_PROVIDER`                         | Domain mailer provider for `forRootFromConfig(...)` (`node` or `noop`). | `node`                                |

> **Security note:** The defaults for `AUTH_BETTER_AUTH_SECRET`, `AUTH_PLUGIN_JWT_SECRET`, and `AUTH_ENCRYPTION_KEY` are intentionally insecure placeholders. Always provide strong, unique values in any deployed environment.

### Injecting the config

```ts
import { InjectAuthConfig, AuthConfig } from '@anarchitects/auth-nest/config';

@Injectable()
export class MyService {
  constructor(@InjectAuthConfig() private readonly config: AuthConfig) {}

  someMethod() {
    const secret = this.config.betterAuth.secret;
  }
}
```

Make sure to import `authConfig` into your module's `ConfigModule`:

```ts
import { ConfigModule } from '@nestjs/config';
import { authConfig } from '@anarchitects/auth-nest/config';

@Module({
  imports: [ConfigModule.forRoot({ load: [authConfig] })],
})
export class AppModule {}
```

## Usage

### Easy mode (single facade import)

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonMailerModule, mailerConfig } from '@anarchitects/common-nest-mailer';
import { AuthModule } from '@anarchitects/auth-nest';
import { authConfig } from '@anarchitects/auth-nest/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig, mailerConfig],
    }),
    CommonMailerModule.forRootFromConfig(),
    AuthModule.forRoot({
      contracts: {
        register: {
          name: {
            required: true,
          },
        },
      },
      presentation: {
        application: {
          encryption: {
            algorithm: 'bcrypt',
            key: process.env.AUTH_ENCRYPTION_KEY!,
          },
        },
      },
      mailer: {
        provider: 'node',
      },
    }),
  ],
})
export class AuthApiModule {}
```

`AuthModule.forRoot(...)` is the preferred integration path when you want a full auth stack with minimal host-module wiring.

Use `AuthModule.forRootFromConfig()` when you want module composition fully driven by `AUTH_*`
variables exposed via `authConfig`.

Apply contract-profile overrides without adding new `AUTH_*` variables:

```ts
AuthModule.forRootFromConfig({
  contracts: {
    register: {
      name: {
        required: true,
      },
    },
  },
});
```

Disable domain mailer wiring when not needed:

```ts
AuthModule.forRoot({
  presentation: { application: { ... } },
  mailer: { provider: 'noop' },
});
```

### Layered composition (advanced)

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonMailerModule, mailerConfig } from '@anarchitects/common-nest-mailer';
import { authConfig } from '@anarchitects/auth-nest/config';
import { AuthApplicationModule } from '@anarchitects/auth-nest/application';
import { AuthPresentationModule } from '@anarchitects/auth-nest/presentation';
import { AuthMailerModule } from '@anarchitects/auth-nest/infrastructure-mailer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig, mailerConfig],
    }),
    CommonMailerModule.forRootFromConfig(),
    AuthApplicationModule.forRoot({
      encryption: {
        algorithm: 'bcrypt',
        key: process.env.AUTH_ENCRYPTION_KEY!,
      },
    }),
    AuthPresentationModule.forRoot({
      contracts: {
        register: {
          name: {
            required: true,
          },
        },
      },
      application: {
        encryption: {
          algorithm: 'bcrypt',
          key: process.env.AUTH_ENCRYPTION_KEY!,
        },
      },
    }),
    AuthMailerModule.forRoot({
      provider: 'node',
    }),
  ],
})
export class AuthApiModule {}
```

Use layered composition when you need to replace or selectively compose infrastructure/application concerns.

### Optional JWT plugin

Core auth remains session-first. Only enable the JWT plugin when the host app explicitly needs token-based routes:

```ts
AuthModule.forRoot({
  presentation: {
    application: {
      plugins: {
        jwt: {
          enabled: true,
          secret: process.env.AUTH_PLUGIN_JWT_SECRET!,
        },
      },
    },
  },
});
```

That mounts the plugin-owned `/auth/jwt/login`, `/auth/jwt/logout`, and `/auth/jwt/refresh` routes alongside the package-owned core session routes.

## Mailer Migration Note

`AuthMailerModule` is now adapter-only. It wraps shared `CommonMailerModule.forRoot(...)`
provider wiring from `@anarchitects/common-nest-mailer` and no longer configures transport with
`MailerModule.forRootAsync(...)`.
Configure transport once at app root with `CommonMailerModule`.
Set `mailer.provider: 'noop'` to disable active delivery behavior per domain.
The shared mailer DI contract (`MailerPort`) and concrete `NodeMailerAdapter` now live in
`@anarchitects/common-nest-mailer`.

### Injecting services

```ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '@anarchitects/auth-nest/application';
import { LoginRequestDTO } from '@anarchitects/auth-ts/dtos';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginRequestDTO) {
    return this.authService.login(dto);
  }
}
```

### Route-level authorization with policies

```ts
import { Controller, Patch, UseGuards } from '@nestjs/common';
import { AuthorizedResource, AuthorizeResource, Policies, PoliciesGuard } from '@anarchitects/auth-nest/presentation';

@Controller('posts')
@UseGuards(PoliciesGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Patch(':postId')
  @Policies({ action: 'update', subject: 'Post' })
  @AuthorizeResource({ action: 'update', subject: 'Post', idParam: 'postId' })
  async updatePost(@AuthorizedResource() post: Post) {
    return this.postsService.update(post);
  }
}
```

```ts
import { AuthModule } from '@anarchitects/auth-nest';

AuthModule.forRoot({
  presentation: {
    application: {
      resourceAuthorization: {
        loaders: {
          Post: async ({ resourceId }) => postsRepository.findById(resourceId),
        },
      },
    },
  },
});
```

`@Policies()` remains the coarse route-level pre-check. `@AuthorizeResource(...)` uses the app-registered loader to fetch the concrete entity, evaluates the instance-level CASL rule behind the scenes, and attaches the authorized resource to the request so `@AuthorizedResource()` can read it in the handler.

## Authorization Model

CASL integration in `@anarchitects/auth-nest` is intentionally split into two layers:

- `@Policies()` uses `RoutePolicy` and performs a coarse route-level pre-check
- `@AuthorizeResource(...)` performs the concrete instance-level check after loading the resource
- `@AuthorizedResource()` gives the handler access to the already loaded and authorized entity

Use this split to avoid overstating what route metadata can prove. Ownership-sensitive rules such as "writers may only update their own posts" need the concrete resource instance before CASL can decide correctly.

### What the library enforces

- persisted permission payloads are validated before they become `PolicyRule[]`
- malformed persisted permission payloads fail closed with a server-side error
- missing registered resource loader is treated as configuration error
- missing route param yields `400`
- missing resource yields `404`

### What the host app must provide

- subject-specific resource loaders for `@AuthorizeResource(...)`
- domain resource retrieval logic and repository access
- route resolver/handler composition that fits the app's domain model

The library owns authorization orchestration. The host app still owns how domain resources are found.

## REST endpoints

The `AuthController` exposes the following routes (all prefixed with `/auth`):

| Method  | Path                            | Description                                |
| ------- | ------------------------------- | ------------------------------------------ |
| `POST`  | `/auth/register`                | Register a new user                        |
| `PATCH` | `/auth/activate`                | Activate a user account                    |
| `POST`  | `/auth/login`                   | Log in and establish a Better Auth session |
| `POST`  | `/auth/logout`                  | Log out and clear the Better Auth session  |
| `PATCH` | `/auth/change-password/:userId` | Change password for a user                 |
| `POST`  | `/auth/forgot-password`         | Request a password-reset email             |
| `POST`  | `/auth/reset-password`          | Reset password with token                  |
| `POST`  | `/auth/verify-email`            | Verify an email address                    |
| `PATCH` | `/auth/update-email/:userId`    | Update email for a user                    |
| `GET`   | `/auth/me`                      | Get logged-in user info and RBAC rules     |

When the JWT plugin is enabled, these plugin-owned routes are also mounted:

| Method | Path                | Description                    |
| ------ | ------------------- | ------------------------------ |
| `POST` | `/auth/jwt/login`   | Log in and receive JWT tokens  |
| `POST` | `/auth/jwt/logout`  | Invalidate JWT plugin tokens   |
| `POST` | `/auth/jwt/refresh` | Refresh JWT plugin token pairs |

## Nx scripts

- `nx build auth-nest` – bundle the Nest library.
- `nx test auth-nest` – execute Jest unit tests.
- `nx lint auth-nest` – run ESLint checks.

## Development notes

- DTO shapes live in `@anarchitects/auth-ts`; update the contract and regenerate DTOs before extending this library.
- Default persistence is TypeORM with schema-qualified tables (see `libs/auth/nest/src/infrastructure-persistence`).
- Invalidated tokens use an unlogged cache table for quick revocation lookups.
- Route schemas are defined in `@anarchitects/auth-ts/dtos` and imported into controller `@RouteSchema` decorators — do not define inline schemas.
- Keep `@Policies()` guidance coarse in docs and examples; use `@AuthorizeResource(...)` for instance-sensitive authorization.
- OpenAPI metadata (`operationId`, `tags`) is assigned in `tools/api-specs/route-metadata.ts`, not in controllers.

## License

Licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0). Unless required by applicable law or agreed to in writing, software is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
