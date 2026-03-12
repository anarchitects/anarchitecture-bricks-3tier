# @anarchitects/auth-nest

NestJS services, controllers, and infrastructure for the Anarchitecture authentication domain. This package wires contract-driven DTOs from `@anarchitects/auth-ts`, orchestrates user lifecycle flows (registration, activation, login/logout, password management, email verification), and persists auth state through pluggable repositories.

## Features

- **Application layer** – `JwtAuthService`, `BcryptHashService`, JWT Passport strategy, CASL-based `PoliciesService` and `AbilityFactory` encapsulating business rules for tokens, passwords, and fine-grained access control.
- **Presentation layer** – `AuthController` exposing REST handlers for the full auth lifecycle, `PoliciesGuard` and `@Policies()` decorator for route-level authorization.
- **Infrastructure persistence** – `PersistenceModule` with TypeORM entities and repositories (users, roles, permissions, invalidated tokens). Configurable adapters to swap implementations while preserving the application contract.
- **Infrastructure mailer** – `AuthMailerModule` wrapper over shared `CommonNodeMailerModule`; `NodeMailerAdapter` is re-exported for compatibility.
- **Config** – Typed `authConfig` namespace using `@nestjs/config` with an `InjectAuthConfig()` helper decorator.

## Installation

```bash
npm install @anarchitects/auth-nest @anarchitects/common-nest-mailer
# or
yarn add @anarchitects/auth-nest @anarchitects/common-nest-mailer
```

Peer requirements:

- `@nestjs/common`, `@nestjs/core`, `@nestjs/jwt`, `@nestjs/typeorm`, `@nestjs/config`, `@nestjs/passport`
- `@anarchitects/auth-ts` for DTOs and shared models
- `@casl/ability` for RBAC policy evaluation
- `@nestjs-modules/mailer` (when using the mailer module)

## Exports

| Import path                                          | Contents                                                                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@anarchitects/auth-nest`                            | `AuthModule.forRoot(...)`, `AuthModule.forRootFromConfig(...)`, plus re-exports of layered entry points for convenience                          |
| `@anarchitects/auth-nest/application`                | `AuthApplicationModule`, `AuthService`, `JwtAuthService`, `HashService`, `BcryptHashService`, `PoliciesService`, `AbilityFactory`, `JwtStrategy` |
| `@anarchitects/auth-nest/presentation`               | `AuthPresentationModule`, `AuthController`, `PoliciesGuard`, `@Policies()` decorator                                                             |
| `@anarchitects/auth-nest/infrastructure-persistence` | `AuthPersistenceModule`, `AuthUserRepository`, `TypeormAuthUserRepository`, migration                                                            |
| `@anarchitects/auth-nest/infrastructure-mailer`      | `AuthMailerModule`, `NodeMailerAdapter`                                                                                                          |
| `@anarchitects/auth-nest/config`                     | `authConfig`, `AuthConfig` type, `InjectAuthConfig()`                                                                                            |

## Configuration

The library reads configuration through `@nestjs/config` using a namespaced `authConfig` registered under the key `auth`. Set the following environment variables to customise behaviour:

| Variable                    | Description                                                                          | Default                  |
| --------------------------- | ------------------------------------------------------------------------------------ | ------------------------ |
| `AUTH_JWT_SECRET`           | Secret key used to sign and verify JWTs. **Must** be overridden in production.       | `default_jwt_secret`     |
| `AUTH_JWT_EXPIRATION`       | Token lifetime (e.g. `3600s`, `15m`, `1d`).                                          | `3600s`                  |
| `AUTH_JWT_AUDIENCE`         | Expected `aud` claim in the JWT.                                                     | `your_audience`          |
| `AUTH_JWT_ISSUER`           | Expected `iss` claim in the JWT.                                                     | `your_issuer`            |
| `AUTH_ENCRYPTION_ALGORITHM` | Password hashing algorithm (`bcrypt`).                                               | `bcrypt`                 |
| `AUTH_ENCRYPTION_KEY`       | Symmetric key for additional encryption needs. **Must** be overridden in production. | `default_encryption_key` |
| `AUTH_PERSISTENCE`          | Persistence adapter key used by `forRootFromConfig(...)`.                            | `typeorm`                |
| `AUTH_MAILER_ENABLED`       | Enables/disables domain mailer wiring in `forRootFromConfig(...)`.                   | `true`                   |
| `AUTH_STRATEGIES`           | Comma-separated auth strategies for config-driven module composition.                | `jwt`                    |

> **Security note:** The defaults for `AUTH_JWT_SECRET` and `AUTH_ENCRYPTION_KEY` are intentionally insecure placeholders. Always provide strong, unique values in any deployed environment.

### Injecting the config

```ts
import { InjectAuthConfig, AuthConfig } from '@anarchitects/auth-nest/config';

@Injectable()
export class MyService {
  constructor(@InjectAuthConfig() private readonly config: AuthConfig) {}

  someMethod() {
    const secret = this.config.jwtSecret;
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
      presentation: {
        application: {
          authStrategies: ['jwt'],
          encryption: {
            algorithm: 'bcrypt',
            key: process.env.AUTH_ENCRYPTION_KEY!,
          },
          persistence: {
            persistence: 'typeorm',
          },
        },
      },
      mailer: {
        features: {
          enabled: true,
        },
      },
    }),
  ],
})
export class AuthApiModule {}
```

`AuthModule.forRoot(...)` is the preferred integration path when you want a full auth stack with minimal host-module wiring.

Use `AuthModule.forRootFromConfig()` when you want module composition fully driven by `AUTH_*`
variables exposed via `authConfig`.

Disable domain mailer wiring when not needed:

```ts
AuthModule.forRoot({
  presentation: { application: { ... } },
  mailer: { features: { enabled: false } },
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
      authStrategies: ['jwt'],
      encryption: {
        algorithm: 'bcrypt',
        key: process.env.AUTH_ENCRYPTION_KEY!,
      },
      persistence: { persistence: 'typeorm' },
    }),
    AuthPresentationModule.forRoot({
      application: {
        authStrategies: ['jwt'],
        encryption: {
          algorithm: 'bcrypt',
          key: process.env.AUTH_ENCRYPTION_KEY!,
        },
        persistence: { persistence: 'typeorm' },
      },
    }),
    AuthMailerModule.forRoot({
      features: { enabled: true },
    }),
  ],
})
export class AuthApiModule {}
```

Use layered composition when you need to replace or selectively compose infrastructure/application concerns.

## Mailer Migration Note

`AuthMailerModule` is now adapter-only. It wraps the shared `CommonNodeMailerModule` from
`@anarchitects/common-nest-mailer` and no longer configures transport with
`MailerModule.forRootAsync(...)`.
Configure transport once at app root with `CommonMailerModule` when `mailer.features.enabled` is `true`.
Disable per-domain wiring with `mailer.features.enabled: false`.
The shared mailer DI contract (`MailerPort`) and concrete `NodeMailerAdapter` now live in
`@anarchitects/common-nest-mailer`.

### Injecting services

```ts
import { Controller, Post, Body } from '@nestjs/common';
import { JwtAuthService } from '@anarchitects/auth-nest/application';
import { LoginRequestDTO } from '@anarchitects/auth-ts/dtos';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: JwtAuthService) {}

  @Post('login')
  login(@Body() dto: LoginRequestDTO) {
    return this.authService.login(dto);
  }
}
```

### Token invalidation

```ts
import { TypeormAuthUserRepository } from '@anarchitects/auth-nest/infrastructure-persistence';

await authUserRepository.invalidateTokens([hashedAccessToken, hashedRefreshToken], userId);
```

### Route-level authorization with policies

```ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { PoliciesGuard, Policies } from '@anarchitects/auth-nest/presentation';

@Controller('admin')
@UseGuards(PoliciesGuard)
export class AdminController {
  @Get()
  @Policies({ action: 'manage', subject: 'User' })
  getAdminDashboard() {
    return { status: 'ok' };
  }
}
```

## REST endpoints

The `AuthController` exposes the following routes (all prefixed with `/auth`):

| Method  | Path                            | Description                            |
| ------- | ------------------------------- | -------------------------------------- |
| `POST`  | `/auth/register`                | Register a new user                    |
| `PATCH` | `/auth/activate`                | Activate a user account                |
| `POST`  | `/auth/login`                   | Log in and receive JWT tokens          |
| `POST`  | `/auth/logout`                  | Log out and invalidate tokens          |
| `PATCH` | `/auth/change-password/:userId` | Change password for a user             |
| `POST`  | `/auth/forgot-password`         | Request a password-reset email         |
| `POST`  | `/auth/reset-password`          | Reset password with token              |
| `POST`  | `/auth/verify-email`            | Verify an email address                |
| `PATCH` | `/auth/update-email/:userId`    | Update email for a user                |
| `POST`  | `/auth/refresh-tokens/:userId`  | Refresh access/refresh tokens          |
| `GET`   | `/auth/me`                      | Get logged-in user info and RBAC rules |

## Nx scripts

- `nx build auth-nest` – bundle the Nest library.
- `nx test auth-nest` – execute Jest unit tests.
- `nx lint auth-nest` – run ESLint checks.

## Development notes

- DTO shapes live in `@anarchitects/auth-ts`; update the contract and regenerate DTOs before extending this library.
- Default persistence is TypeORM with schema-qualified tables (see `libs/auth/nest/src/infrastructure-persistence`).
- Invalidated tokens use an unlogged cache table for quick revocation lookups.
- Route schemas are defined in `@anarchitects/auth-ts/dtos` and imported into controller `@RouteSchema` decorators — do not define inline schemas.
- OpenAPI metadata (`operationId`, `tags`) is assigned in `tools/api-specs/route-metadata.ts`, not in controllers.

## License

Licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0). Unless required by applicable law or agreed to in writing, software is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
