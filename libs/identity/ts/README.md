# @anarchitects/identity-ts

Shared TypeScript models and TypeBox DTO schemas for the Anarchitecture identity domain.

## Developer + AI Agent Start Here

- Treat this package as the canonical home for shared identity contracts and models.
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

- This package is the canonical source for shared identity profile contracts.
- Persistence behavior, repositories, services, and HTTP endpoints belong to follow-up identity issues.

## Contributing

Add new identity DTOs and models here first, then wire Angular and Nest consumers against the published entry points.

## License

Licensed under the Apache License, Version 2.0.
