# Nest Guide

## Intent

This is the Nest implementation cookbook for Anarchitecture Bricks. It focuses on backend module composition and entry-point usage, with public HTTP ownership and local integration guidance defined in:

- [TS Contracts Guide](/guides/ts-contracts.html)
- [Design/UI Systems Guide](/guides/design-ui-systems.html)

## Verified support

The following **upcoming minors** retain Nest 11 and add Nest 12; none drops Nest 11. They are not the currently published npm `latest` versions. The [release plan](https://github.com/anarchitects/anarchitecture-bricks-3tier/blob/main/docs/guides/nest-compatibility-release-plan.md) lists current versions, migrations, domain sibling bumps and publication gates. Use these recipes after the coordinated versions are available.

| Package                            | New minor | Verified Nest     | Verified consumer Node                                                    |
| ---------------------------------- | --------- | ----------------- | ------------------------------------------------------------------------- |
| `@anarchitects/common-nest-mailer` | 0.5       | 11.1.6 and 12.1.2 | Nest 11: 20.19.0, 22.13.0, 24.11.0, 26.11.1; Nest 12: same except Node 20 |
| `@anarchitects/auth-nest`          | 0.12      | 11.1.6 and 12.1.2 | Both: 22.13.0, 24.11.0, 26.11.1; **Node 20 removed**                      |
| `@anarchitects/auth-declarations`  | 0.12      | 11.1.6 and 12.1.2 | Both: 22.13.0, 24.11.0, 26.11.1; standalone Node 20 not certified         |
| `@anarchitects/forms-nest`         | 0.11      | 11.1.6 and 12.1.2 | Nest 11: 20.19.0, 22.13.0, 24.11.0, 26.11.1; Nest 12: same except Node 20 |
| `@anarchitects/identity-nest`      | 0.2       | 11.1.6 and 12.1.2 | Nest 11: 20.19.0, 22.13.0, 24.11.0, 26.11.1; Nest 12: same except Node 20 |
| `@anarchitects/newsletter-nest`    | 0.1       | 11.1.6 and 12.1.2 | Nest 11: 20.19.0, 22.13.0, 24.11.0, 26.11.1; Nest 12: same except Node 20 |

[Seven Linux CI lanes passed](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/38073619350) for #468's packed artifacts. [Validation details](https://github.com/anarchitects/anarchitecture-bricks-3tier/blob/main/docs/guides/nest-release-validation.md) distinguish that commit's evidence from #469's metadata updates and final release verification. Strict NodeNext compilation uses TypeScript 6.0.3 with decorator metadata and `skipLibCheck: false`; runtime checks cover CommonJS and ESM consumers. Five Nest bricks emit CommonJS; Auth Declarations exposes both formats. No host ESM migration is required.

Semver peer ranges describe accepted versions, not exhaustive testing of every combination. Common/core/platform peers are `^11.1.6 || ^12.1.2`; Config is `^4.0.2 || ^12.0.1`; JWT and Nest TypeORM are `^11.0.1 || ^12.0.2` where used. Keep framework majors aligned. Config 4/JWT 11/Nest TypeORM 11 belong to the Nest 11 baseline; modern Config/JWT/TypeORM integrations also pass on Nest 11. The Nest 12 locked graph includes `file-type` 22.1.1, which requires Node >=22; Auth's Kysely 0.29.6 requires Node >=22 on both majors. Open engine ranges do not certify future Node releases or all operating systems.

## Install without Nx

Use an existing plain Nest application or initialize a directory with `npm init -y`. Nx, `@nx/nest`, `@anarchitects/nest` and Nest CLI are not runtime prerequisites. The optional generator plugin's adoption is a separate tooling decision.

Choose **one** framework recipe. Exact upstream versions below match the full packed hosts; testing and compiler packages are development dependencies:

```sh
# Nest 11 baseline (eligible non-Auth hosts also support Node 20.19.0)
npm install @nestjs/common@11.1.6 @nestjs/core@11.1.6 @nestjs/platform-fastify@11.1.6 @nestjs/config@4.0.2 fastify@5.4.0 reflect-metadata@0.1.14 rxjs@7.8.2
npm install --save-dev @nestjs/testing@11.1.6 typescript@6.0.3 @types/node@22.18.6
# Add for Auth/Forms/Identity persistence; Newsletter uses TypeORM directly:
npm install @nestjs/typeorm@11.0.1 typeorm@1.1.0 pg@8.16.3
# Auth only:
npm install @nestjs/jwt@11.0.1
```

```sh
# Nest 12 (verified Node 22.13.0, 24.11.0 or 26.11.1)
npm install @nestjs/common@12.1.2 @nestjs/core@12.1.2 @nestjs/platform-fastify@12.1.2 @nestjs/config@12.0.1 fastify@5.12.5 reflect-metadata@0.1.14 rxjs@7.8.2
npm install --save-dev @nestjs/testing@12.1.2 typescript@6.0.3 @types/node@22.18.6
# Add for Auth/Forms/Identity persistence; Newsletter uses TypeORM directly:
npm install @nestjs/typeorm@12.0.2 typeorm@1.1.0 pg@8.16.3
# Auth only:
npm install @nestjs/jwt@12.0.2
```

Then select the bricks you need, **after their new minors are published**:

```sh
npm install @anarchitects/auth-nest@^0.12.0
npm install @anarchitects/auth-declarations@^0.12.0
npm install @anarchitects/forms-nest@^0.11.0
npm install @anarchitects/identity-nest@^0.2.0
npm install @anarchitects/newsletter-nest@^0.1.0
# Shared transport for Auth, Forms, or native Newsletter:
npm install @anarchitects/common-nest-mailer@^0.5.0 @nestjs-modules/mailer@3.0.2 nodemailer@8.0.5
```

Install commands are alternatives by capability, not a requirement to install all domains. Auth and Forms depend on Common Mailer even when mail delivery is disabled; its peer packages still need to be installed. Identity has no mail dependency. For native Newsletter install `typeorm@1.1.0 pg@8.16.3` plus Common Mailer and its peers; the Nest TypeORM bridge is unnecessary unless another domain uses it. Custom/MailerLite Newsletter hosts may omit TypeORM/Common Mailer when no selected adapter uses them. Optional-peer runtime absence is tested; strict compilation of the entire declaration graph is verified in the full hosts with adapter type dependencies present.

Auth, Forms and Identity install their aligned TS packages transitively; Auth also installs Auth Declarations. Newsletter Nest 0.1 pins Newsletter TS 0.1.0. Keep any direct host imports on those same domain lines. Freeze and review the application's lockfile, then use `npm ci --strict-peer-deps --engine-strict` and `npm ls --all`. Yarn/pnpm consumers use equivalent declared dependencies and their own frozen locks; the compatibility fixtures themselves use npm.

## Host bootstrap and migration

Nest 12.1.2 classifies Fastify's ordinary schema-validation errors as internal errors unless the adapter returns a Nest HTTP exception. This setup preserves HTTP 400 and works on Nest 11 too. Newsletter signature verification additionally requires exact raw request bytes:

```ts
import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';

const adapter = new FastifyAdapter({
  schemaErrorFormatter: (errors, dataVar) => new BadRequestException(`${dataVar} ${errors.map((error) => error.message).join(', ')}`),
});
const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, { rawBody: true });
await app.listen(3000);
```

For CommonJS, put the asynchronous bootstrap inside a function instead of using top-level await. Keep `experimentalDecorators` and `emitDecoratorMetadata` enabled. Apply the package's exported database migrations with `synchronize: false`; do not redefine cross-domain entity relationships or move schemas into controllers. The [per-package migration table](https://github.com/anarchitects/anarchitecture-bricks-3tier/blob/main/docs/guides/nest-compatibility-release-plan.md#package-versions-and-migration) covers every breaking dependency floor, Auth's Node 20 removal and unchanged public APIs.

## Architecture

- Nest libraries follow: `presentation -> application <- infrastructure`.
- Public HTTP schemas/operations belong to `anarchitecture-contracts`. Current TS DTOs/models remain the transitional implementation imports; domain semantics stay local.
- Lightweight auth controller declarations live in `@anarchitects/auth-declarations`.
- Domain libraries expose both facade composition modules and layer-specific secondary entry points.
- Controllers keep `@RouteSchema` pure and imported from TS contract libraries.
- Specs tooling derives operation IDs/tags from pinned canonical operation definitions; generated output is implementation evidence, not canonical authority. See the [conformance guide](canonical-conformance.md).

## Easy Mode with Composition Modules

Use facade composition modules for the default host-app path:

```ts
import { Module } from '@nestjs/common';
import { FormsModule } from '@anarchitects/forms-nest';
import { AuthModule, provideAuthRuntimeGuards } from '@anarchitects/auth-nest';

@Module({
  imports: [FormsModule.forRoot({}), AuthModule.forRoot({})],
  providers: [...provideAuthRuntimeGuards()],
})
export class AppModule {}
```

Choose `forRoot(options)` for explicit configuration or replace that call with `forRootFromConfig(overrides?)` and the package's typed config registration. Do not register both initialization paths for the same domain. Configure shared mail transport and persistence once at app root, following the package README. Easy mode provides predictable integration with minimal Nest wiring.
Activate auth centrally from the root module providers instead of binding guards on individual controllers.

## Advanced Mode with Layer Entry Points

Use layered entry points when you need explicit control over domain composition:

- `@anarchitects/forms-nest/application`
- `@anarchitects/forms-nest/presentation`
- `@anarchitects/forms-nest/infrastructure-*`
- `@anarchitects/forms-nest/config`
- `@anarchitects/auth-declarations`
- `@anarchitects/auth-nest/application`
- `@anarchitects/auth-nest/presentation`
- `@anarchitects/auth-nest/infrastructure-*`
- `@anarchitects/auth-nest/config`
- `@anarchitects/identity-nest/application`, `/presentation`, `/infrastructure-persistence`, `/config`
- `@anarchitects/newsletter-nest/application`, `/presentation`, `/infrastructure-native`, `/infrastructure-persistence`, `/infrastructure-mailerlite`, `/config`
- Common Mailer exposes its modules, ports and transport adapters from `@anarchitects/common-nest-mailer`.

Advanced mode is for replacing adapters, customizing policy wiring, or composing only selected layers while preserving facade compatibility.

## TS Contract Integration

Shared public HTTP contracts are authored Zod-first with operation definitions in
`anarchitecture-contracts`; deterministic OpenAPI 3.1 is their published artifact.
Nest presentation consumes immutable contract versions through verified bindings.
Current imports from `@anarchitects/forms-ts`, `@anarchitects/auth-ts`, Identity and
Newsletter TS packages remain the transitional baseline. Preserve Fastify schema
validation/serialization until equivalent bindings and real HTTP conformance pass.
Domain models, internal ports and `auth-ts` policy semantics remain implementation-owned.
The [TS Contracts Guide](/guides/ts-contracts.html) defines adoption gates and compatibility policy;
see the [exact consumed versions and remaining host gates](canonical-conformance.md).

## Auth CASL Guidance

For `@anarchitects/auth-nest`, document and preserve the two-layer authorization model:

- `@anarchitects/auth-ts` owns `PolicyRule`/`RoutePolicy` semantics; Contracts owns their public HTTP representation, with lossless mapping required
- `@anarchitects/auth-declarations` owns controller-facing decorators such as `@Public()`, `@Policies(...)`, and `@AuthorizeResource(...)`
- `@Policies()` is a coarse route-level pre-check over `{ action, subject }`
- `@AuthorizeResource(...)` is the resource-aware declaration that points runtime enforcement at the correct loader and route param
- `@anarchitects/auth-nest` owns runtime enforcement and `@AuthorizedResource()`

This split is required for ownership-sensitive rules. Route metadata alone cannot prove that a user may update a specific post; the resource must be loaded before CASL can make that final decision.

Typical composition:

```ts
import { Controller, Patch } from '@nestjs/common';
import { AuthorizeResource, Policies } from '@anarchitects/auth-declarations';
import { AuthorizedResource, AuthModule, provideAuthRuntimeGuards } from '@anarchitects/auth-nest';

@Controller('posts')
export class PostsController {
  @Patch(':postId')
  @Policies({ action: 'update', subject: 'Post' })
  @AuthorizeResource({ action: 'update', subject: 'Post', idParam: 'postId' })
  updatePost(@AuthorizedResource() post: Post) {
    return post;
  }
}

@Module({
  imports: [AuthModule.forRoot({})],
  providers: [...provideAuthRuntimeGuards()],
})
export class AppModule {}
```

Malformed persisted permission payloads are treated as trust-boundary failures and must fail closed instead of being partially trusted.

## Library Entry Point Cookbook

- Fast start:
  use root module imports (`@anarchitects/forms-nest`, `@anarchitects/auth-nest`) with `forRoot` or `forRootFromConfig`.
- Config-driven environments:
  prefer `forRootFromConfig` with typed `registerAs` config.
- Adapter override:
  keep facade contract stable, then replace only targeted `infrastructure-*` pieces through secondary entry points.
- Partial composition:
  combine `application` and selected `presentation`/`infrastructure-*` modules when host apps need strict control.

## Schema Evolution and Compatibility

- Review/version shared HTTP changes in Contracts first; even additive changes require semantic compatibility review.
- Keep backward-compatible schema keys during migration windows.
- Coordinate TS + Nest + Angular updates in one change when compatibility risk exists.
- Preserve stable contracts required by frontend composition and runtime layout behavior.

## Contract Verification Workflow

- Validate that controller schemas import TS contracts (no inline drift).
- Preserve local OpenAPI checks; adoption additionally compares against pinned canonical OpenAPI and tests positive/negative/security behavior over real HTTP.
- Verify Angular consumers (`@anarchitects/forms-angular`, `@anarchitects/auth-angular`) against updated contracts.
- Run docs quality checks:
  `yarn nx run docs-hub:validate-content`, `yarn nx run docs-hub:build`, `yarn nx run docs-hub:verify`.

## Common Pitfalls

- Treating local TS DTOs, Nest controllers or generated OpenAPI as canonical public HTTP authority.
- Skipping facade modules and jumping to layer entry points for simple use cases.
- Defining inline route schemas instead of importing TS DTO schemas.
- Mixing persistence internals across domain boundaries.
- Introducing schema changes without verifying cross-stack consumer impact.

## Newsletter integration

See [Newsletter integration](/guides/newsletter-integration.html) for both provider examples, Forms-backed signup, OpenAPI and browser/database regression. The [migration guide](/guides/newsletter-migration.html) separates reusable capabilities from host policy and app-local data migration.
