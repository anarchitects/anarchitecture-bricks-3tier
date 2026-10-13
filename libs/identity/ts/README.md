# @anarchitects/identity-ts

Public HTTP authority belongs to [`anarchitecture-contracts`](https://github.com/anarchitects/anarchitecture-contracts)
under [ADR-0016](https://github.com/anarchitects/anarchitecture-bricks-3tier/blob/main/docs/adr/0016-consume-canonical-public-api-contracts.md).
This package retains its domain models and current TypeBox DTOs/exports as the
transitional implementation baseline. Canonical Zod schemas and operations are
adopted through immutable versions and verified compatibility; this README does
not claim that adoption is complete. See the [TS Contracts Guide](https://github.com/anarchitects/anarchitecture-bricks-3tier/blob/main/docs/guides/ts-contracts.md).

The next minor includes explicit `.js` relative declaration specifiers for strict NodeNext consumers. Existing public exports and ESM/CJS bundles are preserved. Packed Nest 11/12 consumers verify this contract through `release-tools:test-forms-identity-nest-compatibility` (#466). The declaration correction can also be backported to the previous maintenance minor.

Shared TypeScript models and TypeBox DTO schemas for the Anarchitecture identity domain.

## Developer + AI Agent Start Here

- Keep identity domain models here and preserve transitional DTO exports; Contracts owns canonical public HTTP definitions.
- Prefer public imports from `@anarchitects/identity-ts`, `@anarchitects/identity-ts/models`, or `@anarchitects/identity-ts/dtos`.
- Keep framework-specific behavior in `@anarchitects/identity-angular` and `@anarchitects/identity-nest`.

## Features

- Canonical shared `UserProfile` model for future cross-stack use
- TypeBox DTO and schema contracts for create/get/update profile operations
- Clean root and secondary entry points without deep-import requirements
- Publishable package metadata aligned with the rest of the workspace

## Installation

```bash
npm install @anarchitects/identity-ts
# or
yarn add @anarchitects/identity-ts
# or
pnpm add @anarchitects/identity-ts
```

## Entry points

| Import path                        | Description                                     |
| ---------------------------------- | ----------------------------------------------- |
| `@anarchitects/identity-ts`        | Root barrel for shared identity models and DTOs |
| `@anarchitects/identity-ts/models` | Shared identity model definitions               |
| `@anarchitects/identity-ts/dtos`   | Shared identity DTO schemas and types           |

## Usage

```ts
import { CreateUserProfileRequestDTO, UserProfile } from '@anarchitects/identity-ts';

const createProfile: CreateUserProfileRequestDTO = {
  authUserId: 'auth-user-id',
  displayName: 'Jane Doe',
};

const profile: UserProfile = {
  id: 'profile-id',
  authUserId: 'auth-user-id',
  displayName: 'Jane Doe',
  givenName: 'Jane',
  familyName: 'Doe',
  avatarUrl: null,
  locale: 'en-BE',
  timeZone: 'Europe/Brussels',
  createdAt: new Date('2026-05-08T12:00:00.000Z'),
  updatedAt: new Date('2026-05-08T12:00:00.000Z'),
};
```

## Scripts

- `yarn nx run identity-ts:build`
- `yarn nx run identity-ts:test`

## Development notes

- This package owns local profile models and transitional DTOs; canonical HTTP definitions belong to Contracts.
- Persistence behavior, repositories, services, and HTTP endpoints belong to follow-up identity issues.

## Contributing

Coordinate public HTTP changes in Contracts first, then adapt local DTO bindings and Angular/Nest consumers through published entry points. Domain model changes remain local.

## License

Licensed under the Apache License, Version 2.0.
