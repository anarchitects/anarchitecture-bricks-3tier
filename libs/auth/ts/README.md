# @anarchitects/auth-ts

TypeScript DTOs and domain models for the Anarchitecture authentication stack. The package bundles:

- Implementation-driven request/response schemas authored with [TypeBox](https://github.com/sinclairzx81/typebox)
- Type-safe DTO aliases consumed by Angular and Nest libraries and reflected in generated OpenAPI docs
- Domain models (`User`, `Role`, `Permission`) for composing dynamic RBAC logic across services

Use it to validate inbound/outbound payloads, share typings between Angular/Nest bricks, and keep auth-specific logic consistent across tiers.

## Features

- Centralized TypeBox DTO schemas shared by Angular and Nest stacks
- Domain model contracts for users, roles, and permissions
- Reusable validation + type-inference building blocks for auth flows

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
| `@anarchitects/auth-ts`        | Barrel re-export for everything in this library  |
| `@anarchitects/auth-ts/dtos`   | Request/response schemas and DTO types (TypeBox) |
| `@anarchitects/auth-ts/models` | Persistence-facing domain models used for RBAC   |

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
import { User, Role, Permission } from '@anarchitects/auth-ts/models';

function can(user: User, action: string, subject: string): boolean {
  const roles: Role[] = user.roles ?? [];
  return roles.some((role) => (role.permissions ?? []).some((permission: Permission) => permission.action === action && permission.subject === subject));
}
```

The models include timestamps (`createdAt`, `updatedAt`) and bidirectional relationships to support dynamic RBAC composition in persistence layers.

## Scripts

- `nx build auth-ts` — build the distributable package with Vite.
- `nx test auth-ts` — run the Vitest suite (DTO schema checks and type-level assertions).

## Development notes

- Treat this package as the source of truth for auth DTO and model contracts.
- When changing DTO schemas, regenerate OpenAPI in the workspace (`nx run api-specs:generate`).
- Keep framework-specific concerns out of this package; Angular/Nest behavior belongs in domain libraries.

## Contributing

Auth DTOs are maintained in this package and consumed by Nest presentation routes. Update these schemas first, then regenerate OpenAPI via `nx run api-specs:generate` so every stack stays in sync.

## License

Licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0) (the "License"); you may not use this package except in compliance with the License. You may obtain a copy of the License at the linked address or in the repository's `LICENSE` file. Unless required by applicable law or agreed to in writing, distributed code is provided on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
