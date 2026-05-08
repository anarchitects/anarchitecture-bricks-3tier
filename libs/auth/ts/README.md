# @anarchitects/auth-ts

TypeScript DTOs and domain models for the Anarchitecture authentication stack. The package bundles:

- Implementation-driven request/response schemas authored with [TypeBox](https://github.com/sinclairzx81/typebox)
- Type-safe DTO aliases consumed by Angular and Nest libraries and reflected in generated OpenAPI docs
- Domain models (`AuthUser`, `Role`, `Permission`) for composing dynamic RBAC logic across services
- Contract-driven auth profile factories that generate backend request schemas and frontend form metadata from one config

Use it to validate inbound/outbound payloads, share typings between Angular/Nest bricks, and keep auth-specific logic consistent across tiers.

Migration guidance for the Better Auth realignment lives in the [auth migration guide](../../../docs/guides/auth-migration.md).
Migration guidance for the contract-driven auth profile model lives in the [auth contract migration guide](../../../docs/guides/auth-contracts-migration.md).

## Developer + AI Agent Start Here

- Read this README before generating DTO/model code that depends on `@anarchitects/auth-ts`.
- Treat this package as the source of truth for auth DTO and model contracts.
- Prefer public exports (`@anarchitects/auth-ts`, `/dtos`, `/models`) and avoid internal path imports.
- Keep framework-specific behavior in Angular/Nest packages, not in this TS contract package.

## Features

- Centralized TypeBox DTO schemas shared by Angular and Nest stacks
- Domain model contracts for users, roles, and permissions
- Reusable validation + type-inference building blocks for auth flows
- Contract profile config, compatibility checks, and schema factories for runtime/frontend alignment

## Authorization Contract

`@anarchitects/auth-ts` is the source of truth for serialized auth rule shape, but it does not enforce frontend or backend authorization by itself.

### `PolicyRule`

Serialized RBAC rules use the following contract:

- required: `action`, `subject`
- optional: `conditions`, `fields`, `inverted`, `reason`
- `action` and `subject` stay open strings for compatibility across apps
- malformed rule payloads are rejected fail-closed by the shared DTO parsers

This is the contract emitted by `/auth/me`, persisted through auth permission mapping, and consumed by Angular/Nest authorization helpers.

### `RoutePolicy`

`RoutePolicy` is intentionally narrower than `PolicyRule`:

- shape: `{ action, subject }`
- purpose: coarse route-attempt checks
- not a substitute for instance-level authorization

Use `RoutePolicy` when a consumer only needs to answer "may this user attempt this kind of work at all?" Concrete ownership or field-sensitive checks still belong to loaded resources and CASL ability evaluation in Angular/Nest layers.

This is the shared contract behind `@anarchitects/auth-declarations` route
metadata and the coarse route-attempt helpers in `@anarchitects/auth-angular`.
It is intentionally not the full resource-authorization contract.

## Installation

```bash
npm install @anarchitects/auth-ts
# or
yarn add @anarchitects/auth-ts
# or
pnpm add @anarchitects/auth-ts
```

## Entry points

| Import path                       | Description                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| `@anarchitects/auth-ts`           | Barrel re-export for core models plus the core/session DTO surface                    |
| `@anarchitects/auth-ts/contracts` | Contract profile config, schema factories, compatibility helpers, and payload shaping |
| `@anarchitects/auth-ts/dtos`      | Core/session request-response schemas and DTO types (TypeBox)                         |
| `@anarchitects/auth-ts/dtos/jwt`  | JWT plugin-specific DTO types and schemas                                             |
| `@anarchitects/auth-ts/models`    | Domain models used for user/session/RBAC composition                                  |

## Contract Profiles

`@anarchitects/auth-ts` is the source of truth for contract-driven auth behavior across Nest and Angular.

- `AuthContractConfig` defines the profile shape for register, login, forgot-password, reset-password, verify-email, change-password, and logout.
- `DefaultAuthContractConfig` is the published default profile.
- `createAuthContracts(config)` derives request schemas and form metadata from one profile.
- `assertContractCompatibility(config, expectedVersion)` fails fast when a consumer expects a different profile version.

Use the factory whenever you need a custom auth profile or want one object that drives both runtime validation and UI behavior:

```ts
import { DefaultAuthContractConfig, assertContractCompatibility, createAuthContracts } from '@anarchitects/auth-ts';

assertContractCompatibility(DefaultAuthContractConfig, '1.0.0');

const contracts = createAuthContracts(DefaultAuthContractConfig);

contracts.registerRequestSchema;
contracts.registerFormMeta.name.required;
contracts.changePasswordFormMeta.newPassword.minLength;
```

Custom profiles are built by copying the default profile and overriding only the fields you want to change:

```ts
import { type AuthContractConfig, DefaultAuthContractConfig, createAuthContracts } from '@anarchitects/auth-ts';

const productProfile: AuthContractConfig = {
  ...DefaultAuthContractConfig,
  version: '1.0.0',
  register: {
    ...DefaultAuthContractConfig.register,
    name: {
      ...DefaultAuthContractConfig.register.name,
      required: true,
      minLength: 3,
      emptyStringPolicy: 'strip',
    },
  },
  login: {
    ...DefaultAuthContractConfig.login,
    password: {
      ...DefaultAuthContractConfig.login.password,
      minLength: 10,
    },
  },
};

const contracts = createAuthContracts(productProfile);
```

The static DTO schema exports such as `RegisterRequestSchema` and `LoginRequestSchema` remain available as default-profile convenience helpers. When a consumer needs profile customization, switch from those fixed exports to `createAuthContracts(...)`.

## Usage

### Validating DTO payloads

```ts
import { Value } from '@sinclair/typebox/value';
import { LoginRequestSchema, LoginRequestDTO } from '@anarchitects/auth-ts/dtos';

const payload: LoginRequestDTO = {
  credential: 'user@example.com',
  password: 'secret123',
};

const errors = [...Value.Errors(LoginRequestSchema, payload)];
if (errors.length > 0) {
  // handle validation error details
}
```

> **Note:** TypeBox does not ship built-in email validation. Register the format once in your runtime (for example, during app bootstrap):
>
> ```ts
> import { FormatRegistry } from '@sinclair/typebox';
>
> FormatRegistry.Set('email', (value: unknown): value is string => {
>   return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
> });
> ```

### Working with domain models

```ts
import { AuthUser, Role, Permission } from '@anarchitects/auth-ts';

function can(user: AuthUser, action: string, subject: string): boolean {
  const roles: Role[] = user.roles ?? [];
  return roles.some((role) => (role.permissions ?? []).some((permission: Permission) => permission.action === action && permission.subject === subject));
}
```

The models include timestamps (`createdAt`, `updatedAt`) and bidirectional relationships to support dynamic RBAC composition in persistence layers.

`AuthUser` is the preferred shared auth-domain user contract. `User` remains exported as a temporary compatibility alias for existing consumers.

## AuthUser migration

- Preferred import moving forward: `import { AuthUser } from '@anarchitects/auth-ts'` or `@anarchitects/auth-ts/models`
- Temporary compatibility alias: `User` remains exported and is type-equivalent to `AuthUser`
- Downstream migration path: rename local imports, annotations, and helper signatures from `User` to `AuthUser`; no DTO field names or runtime payload shapes changed as part of this rename
- Source compatibility note: payloads such as `/auth/me` still use the field name `user`; the rename only changes the preferred shared TypeScript contract name behind that field
- Database migration note: none in `@anarchitects/auth-ts`; this package only ships shared contracts and runtime validation helpers

### Contract profile versioning

- Contract profiles carry their own `version` field.
- Compatibility checks are exact today: `assertContractCompatibility(...)` compares the expected and actual version strings directly.
- Treat stricter default-profile changes as breaking changes. Examples: raising `minLength`, lowering `maxLength`, or changing a field from optional to required.
- Consumers should pin the profile version they expect and update intentionally when contract constraints change.

## Scripts

- `nx build auth-ts` — build the distributable package with Vite.
- `nx test auth-ts` — run the Vitest suite (DTO schema checks and type-level assertions).

## Development notes

- Treat this package as the source of truth for auth DTO and model contracts.
- Keep the root DTO surface session-first. JWT token DTOs belong under `@anarchitects/auth-ts/dtos/jwt`, not `@anarchitects/auth-ts/dtos`.
- Use `parsePolicyRuleDTO(...)` / `parsePolicyRuleArrayDTO(...)` when authorization rules cross trust boundaries and need runtime validation.
- When changing DTO schemas, regenerate OpenAPI in the workspace (`nx run api-specs:generate`).
- Keep framework-specific concerns out of this package; Angular/Nest behavior belongs in domain libraries.

### Snapshot test workflow

- Default-profile auth contract schemas are snapshotted in `src/contracts/auth-contracts.factory.spec.ts`.
- Snapshot artifacts are stored next to the spec in `src/contracts/__snapshots__/auth-contracts.factory.spec.ts.snap`.
- Run snapshot checks with `yarn nx run auth-ts:test`.
- Update snapshots intentionally with `yarn nx run auth-ts:test -- -u`.
- Treat snapshot diffs as contract changes: review them in pull requests and confirm every schema diff is expected.

### Contract profile versioning

- `AuthContractConfig` includes a required `version` field.
- Use `assertContractCompatibility(config, expectedVersion)` from `@anarchitects/auth-ts` (or `/contracts`) to fail fast on profile mismatches.
- The default profile version follows semver.
- Bump the major version when any default profile constraint becomes stricter (for example, higher minLength, lower maxLength, or turning an optional field into required).

## Contributing

Auth DTOs are maintained in this package and consumed by Nest presentation routes. Update these schemas first, then regenerate OpenAPI via `nx run api-specs:generate` so every stack stays in sync.

## License

Licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0) (the "License"); you may not use this package except in compliance with the License. You may obtain a copy of the License at the linked address or in the repository's `LICENSE` file. Unless required by applicable law or agreed to in writing, distributed code is provided on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
