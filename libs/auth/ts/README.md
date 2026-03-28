# @anarchitects/auth-ts

TypeScript DTOs and domain models for the Anarchitecture authentication stack. The package bundles:

- Implementation-driven request/response schemas authored with [TypeBox](https://github.com/sinclairzx81/typebox)
- Type-safe DTO aliases consumed by Angular and Nest libraries and reflected in generated OpenAPI docs
- Domain models (`User`, `Role`, `Permission`) for composing dynamic RBAC logic across services

Use it to validate inbound/outbound payloads, share typings between Angular/Nest bricks, and keep auth-specific logic consistent across tiers.

Migration guidance for the Better Auth realignment lives in the [auth migration guide](../../../docs/guides/auth-migration.md).

## Developer + AI Agent Start Here

- Read this README before generating DTO/model code that depends on `@anarchitects/auth-ts`.
- Treat this package as the source of truth for auth DTO and model contracts.
- Prefer public exports (`@anarchitects/auth-ts`, `/dtos`, `/models`) and avoid internal path imports.
- Keep framework-specific behavior in Angular/Nest packages, not in this TS contract package.

## Features

- Centralized TypeBox DTO schemas shared by Angular and Nest stacks
- Domain model contracts for users, roles, and permissions
- Reusable validation + type-inference building blocks for auth flows

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

## Installation

```bash
npm install @anarchitects/auth-ts
# or
yarn add @anarchitects/auth-ts
# or
pnpm add @anarchitects/auth-ts
```

## Entry points

| Import path                    | Description                                      |
| ------------------------------ | ------------------------------------------------ |
| `@anarchitects/auth-ts`        | Barrel re-export for core models plus the core/session DTO surface |
| `@anarchitects/auth-ts/dtos`   | Core/session request-response schemas and DTO types (TypeBox) |
| `@anarchitects/auth-ts/dtos/jwt` | JWT plugin-specific DTO types and schemas |
| `@anarchitects/auth-ts/models` | Domain models used for user/session/RBAC composition |

## Usage

### Validating DTO payloads

```ts
import { Value } from '@sinclair/typebox/value';
import {
  LoginRequestSchema,
  LoginRequestDTO,
} from '@anarchitects/auth-ts/dtos';

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
>   return (
>     typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
>   );
> });
> ```

### Working with domain models

```ts
import { User, Role, Permission } from '@anarchitects/auth-ts/models';

function can(user: User, action: string, subject: string): boolean {
  const roles: Role[] = user.roles ?? [];
  return roles.some((role) =>
    (role.permissions ?? []).some(
      (permission: Permission) =>
        permission.action === action && permission.subject === subject,
    ),
  );
}
```

The models include timestamps (`createdAt`, `updatedAt`) and bidirectional relationships to support dynamic RBAC composition in persistence layers.

## Scripts

- `nx build auth-ts` — build the distributable package with Vite.
- `nx test auth-ts` — run the Vitest suite (DTO schema checks and type-level assertions).

## Development notes

- Treat this package as the source of truth for auth DTO and model contracts.
- Keep the root DTO surface session-first. JWT token DTOs belong under `@anarchitects/auth-ts/dtos/jwt`, not `@anarchitects/auth-ts/dtos`.
- Use `parsePolicyRuleDTO(...)` / `parsePolicyRuleArrayDTO(...)` when authorization rules cross trust boundaries and need runtime validation.
- When changing DTO schemas, regenerate OpenAPI in the workspace (`nx run api-specs:generate`).
- Keep framework-specific concerns out of this package; Angular/Nest behavior belongs in domain libraries.

## Contributing

Auth DTOs are maintained in this package and consumed by Nest presentation routes. Update these schemas first, then regenerate OpenAPI via `nx run api-specs:generate` so every stack stays in sync.

## License

Licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0) (the "License"); you may not use this package except in compliance with the License. You may obtain a copy of the License at the linked address or in the repository's `LICENSE` file. Unless required by applicable law or agreed to in writing, distributed code is provided on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
