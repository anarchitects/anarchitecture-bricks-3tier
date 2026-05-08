# @anarchitects/identity-nest

NestJS facade and layer entry points for the Anarchitecture identity domain.

## Developer + AI Agent Start Here

- Start with `IdentityModule.forRoot()` or `IdentityModule.forRootFromConfig()` from the root entry point.
- Keep runtime behavior minimal until identity-specific application services and presentation behavior land.
- Import advanced composition surfaces through public secondary entry points only.

## Features

- Root facade module with `forRoot` and `forRootFromConfig`
- Explicit `application`, `presentation`, `infrastructure`, `infrastructure-persistence`, and `config` entry points
- TypeORM-backed `UserProfile` persistence with scalar `authUserId` ownership
- No inverse auth persistence relations; identity stores ownership through `authUserId` only

## Installation

```bash
npm install @anarchitects/identity-nest
# or
yarn add @anarchitects/identity-nest
# or
pnpm add @anarchitects/identity-nest
```

## Exports

| Import path                                              | Description                                                             |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `@anarchitects/identity-nest`                            | Root facade module and convenience re-exports                           |
| `@anarchitects/identity-nest/application`                | Application-layer placeholder module                                    |
| `@anarchitects/identity-nest/presentation`               | Presentation-layer placeholder module                                   |
| `@anarchitects/identity-nest/infrastructure`             | Infrastructure-layer placeholder module                                 |
| `@anarchitects/identity-nest/infrastructure-persistence` | `UserProfileEntity`, migration, persistence module, and repository port |
| `@anarchitects/identity-nest/config`                     | Typed config namespace and module option helpers                        |

## Usage

```ts
import { Module } from '@nestjs/common';
import { IdentityModule } from '@anarchitects/identity-nest';

@Module({
  imports: [IdentityModule.forRoot()],
})
export class AppModule {}
```

## Scripts

- `yarn nx run identity-nest:build`
- `yarn nx run identity-nest:test`

## Development notes

- This package intentionally contains no controllers or endpoints in issue `#315`.
- `UserProfile` persistence lives in the identity domain and stores auth ownership only through scalar `authUserId`.
- Do not add TypeORM relations back into auth; future identity runtime behavior should extend the published layer entry points instead of introducing deep imports.

## Contributing

Keep `presentation -> application <- infrastructure` boundaries intact and add new behavior through the published entry points.

## License

Licensed under the Apache License, Version 2.0.
