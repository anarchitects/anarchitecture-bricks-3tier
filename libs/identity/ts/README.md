# @anarchitects/identity-ts

Shared TypeScript models for the Anarchitecture identity domain.

## Developer + AI Agent Start Here

- Treat this package as the canonical home for shared identity contracts and models.
- Prefer public imports from `@anarchitects/identity-ts` or `@anarchitects/identity-ts/models`.
- Keep framework-specific behavior in `@anarchitects/identity-angular` and `@anarchitects/identity-nest`.

## Features

- Canonical shared identity model placeholders for future cross-stack use
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

| Import path                        | Description                            |
| ---------------------------------- | -------------------------------------- |
| `@anarchitects/identity-ts`        | Root barrel for shared identity models |
| `@anarchitects/identity-ts/models` | Shared identity model definitions      |

## Usage

```ts
import { IdentityProfile } from '@anarchitects/identity-ts';

const profile: IdentityProfile = {
  id: 'identity-profile-id',
};
```

## Scripts

- `yarn nx run identity-ts:build`
- `yarn nx run identity-ts:test`

## Development notes

- This package intentionally exposes only minimal shared model placeholders in issue `#310`.
- Persistence behavior, DTO expansion, and cross-domain rules belong to follow-up identity issues.

## Contributing

Add new identity DTOs and models here first, then wire Angular and Nest consumers against the published entry points.

## License

Licensed under the Apache License, Version 2.0.
