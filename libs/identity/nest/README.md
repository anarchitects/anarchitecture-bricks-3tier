# @anarchitects/identity-nest

NestJS facade and layer entry points for the Anarchitecture identity domain.

## Developer + AI Agent Start Here

- Start with `IdentityModule.forRoot()` or `IdentityModule.forRootFromConfig()` from the root entry point.
- Start from the published facade, then compose profile endpoints through the presentation entry point when you need the built-in controller surface.
- Import advanced composition surfaces through public secondary entry points only.

## Features

- Root facade module with `forRoot` and `forRootFromConfig`
- Explicit `application`, `presentation`, `infrastructure`, `infrastructure-persistence`, and `config` entry points
- TypeORM-backed `UserProfile` persistence with scalar `authUserId` ownership
- Identity profile application services and controller endpoints for create/get/update flows
- No inverse auth persistence relations; identity stores ownership through `authUserId` only

## Installation

The Nest 11/12 contract is prepared for the **unreleased Identity 0.2 minor**, with `@anarchitects/identity-ts@^0.2.0`. The `0.1.x` line remains available for Nest 11 maintenance. Do not ship these dependency-floor changes as a patch on the previous minor.

```bash
npm install @anarchitects/identity-nest
# or
yarn add @anarchitects/identity-nest
# or
pnpm add @anarchitects/identity-nest
```

The TypeORM 1 package line requires Node.js
`^20.19.0 || ^22.13.0 || >=24.11.0`, `@nestjs/typeorm@^11.0.1 || ^12.0.2`, and
`typeorm@^1.1.0`.

### Nest 11/12 compatibility (#466)

Supported peers are Nest common/platform-fastify `^11.1.6 || ^12.1.2`, Config `^4.0.2 || ^12.0.1`, Nest TypeORM `^11.0.1 || ^12.0.2`, and TypeORM `^1.1.0`. Keep Nest common/core/platform/testing on the same major. The older integration packages themselves exclude Nest 12.

| Consumer        | Nest   | Config | Nest TypeORM | Fastify |
| --------------- | ------ | ------ | ------------ | ------- |
| `nest11`        | 11.1.6 | 4.0.2  | 11.0.1       | 5.4.0   |
| `nest11-modern` | 11.1.6 | 12.0.1 | 12.0.2       | 5.12.5  |
| `nest12`        | 12.1.2 | 12.0.1 | 12.0.2       | 5.12.5  |

The joint Forms/Identity hosts use TypeORM 1.1.0, PostgreSQL 16, Mailer 3.0.2 and Nodemailer 8.0.5. Identity itself has no mailer dependency. They compile strict NodeNext CJS/ESM consumers without `skipLibCheck`, exercise every Nest layer, run exported migrations with `synchronize: false`, and verify facade, config-driven and advanced composition. HTTP checks cover Forms definitions/submissions and Identity create/read/update, validation and not-found responses. Data persists through app restarts; Forms mail is captured through Nodemailer/Handlebars or disabled with `noop`.

Fastify's default request coercion is unchanged on both majors: a nullable profile string sent as `null` can become `""`, and a numeric string-field value can be coerced to a string. The host checks use an object to test invalid string input and verify database nulls through the repository port. Hosts needing strict body types must configure their validator separately; changing that behavior is outside #466.

**Breaking upgrade requirements:** Identity 0.2 requires Identity TS 0.2 and raises the Nest common floor from 11.0.0 to the verified 11.1.6. Public facade and secondary entry points remain unchanged. The shared TS package now emits explicit `.js` relative specifiers so its declarations work with strict NodeNext consumers; its ESM/CJS bundle formats remain unchanged.

**Nest 12 Fastify bootstrap requirement:** configure schema validation errors as Nest HTTP exceptions so invalid requests remain HTTP 400 instead of becoming HTTP 500. The same adapter setup works with Nest 11:

```ts
import { BadRequestException } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';

const adapter = new FastifyAdapter({
  schemaErrorFormatter: (errors, dataVar) => new BadRequestException(`${dataVar} ${errors.map((error) => error.message).join(', ')}`),
});
// Pass adapter to NestFactory.create<NestFastifyApplication>(AppModule, adapter).
```

Run the joint uncached packed-consumer checks with Docker available:

```bash
yarn nx run release-tools:test-forms-identity-nest-compatibility:nest11
yarn nx run release-tools:test-forms-identity-nest-compatibility:nest11-modern
yarn nx run release-tools:test-forms-identity-nest-compatibility:nest12
```

`tools/testing/forms-identity-nest-hosts/candidates.json` stages only upcoming **versions** (Forms 0.11, Identity 0.2 and Common Mailer 0.5). Source/build/packed dependency and peer contracts must match; no dependency rewrites, overrides or workspace links are used. Registry dependencies have frozen locks and integrity hashes, strict peer/engine checks and no install scripts. Source versions and publication remain CI-release-owned. To refresh a lock intentionally after building, run `node tools/testing/run-forms-identity-nest-host.mjs <consumer> --refresh-lock`, then run the normal Nx target.

Verified on Node 24.21.0, npm 11.19.0 and TypeScript 6.0.3. The existing engine range is unchanged; minimum-Node and broader CI verification remain #468's release gate. The NodeNext declaration fix can be backported separately to the previous TS minor. Deprecation of affected published versions may be considered after a fixed maintenance release and requires human approval; this change performs no release or deprecation.

## Exports

| Import path                                              | Description                                                             |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `@anarchitects/identity-nest`                            | Root facade module and convenience re-exports                           |
| `@anarchitects/identity-nest/application`                | Application-layer placeholder module                                    |
| `@anarchitects/identity-nest/presentation`               | Presentation module and `UserProfilesController`                        |
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

- The package now exposes profile endpoints at `/identity/profiles`, `/identity/profiles/:profileId`, and `/identity/profiles/by-auth-user/:authUserId`.
- `UserProfile` persistence lives in the identity domain and stores auth ownership only through scalar `authUserId`.
- Do not add TypeORM relations back into auth; future identity runtime behavior should extend the published layer entry points instead of introducing deep imports.

## Contributing

Keep `presentation -> application <- infrastructure` boundaries intact and add new behavior through the published entry points.

## License

Licensed under the Apache License, Version 2.0.
