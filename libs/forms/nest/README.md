# @anarchitects/forms-nest

NestJS bricks that expose the Forms platform implementation through layered modules. The library ships
application services, HTTP controllers, and infrastructure adapters so a NestJS host can fetch form
definitions and accept submissions without re-implementing domain logic.

## Developer + AI Agent Start Here

- Read this README before generating integration code for `@anarchitects/forms-nest`.
- Start with `@anarchitects/forms-nest` root facade (`FormsModule.forRoot(...)` or `FormsModule.forRootFromConfig(...)`) unless you explicitly need layered overrides.
- Keep shared mail transport setup at app root via `@anarchitects/common-nest-mailer`; keep forms infrastructure modules adapter-focused.
- Use DTO contracts from `@anarchitects/forms-ts` and keep route/schema behavior aligned with this package guidance.

## Features

- Facade + layered module composition for deterministic host integration
- Implementation-aligned controllers and services backed by shared DTO contracts
- Pluggable infrastructure adapters for persistence and mail delivery

## Entry points

| Entry point                                           | Responsibility                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `@anarchitects/forms-nest`                            | `FormsModule.forRoot(...)` and `FormsModule.forRootFromConfig(...)` facade for full-stack composition              |
| `@anarchitects/forms-nest/application`                | Use-case services plus the `FormsApplicationModule`, along with DI tokens for repository and mailer ports.         |
| `@anarchitects/forms-nest/presentation`               | Fastify-ready controllers for form definitions, submission writes, and submission list/detail reads.               |
| `@anarchitects/forms-nest/infrastructure-persistence` | `FormsInfrastructurePersistenceModule.forRoot({ persistence: 'typeorm' })` — configurable persistence adapter.     |
| `@anarchitects/forms-nest/infrastructure-mailer`      | `FormsInfrastructureMailerModule`, `NestMailerAdapter` — domain wrapper over shared common mailer provider wiring. |
| `@anarchitects/forms-nest/config`                     | `formsConfig`, `FormsConfig`, `InjectFormsConfig()`, and public module option types for root + secondary modules.  |

You can combine these layers or swap infrastructure modules with custom implementations that respect
the exported tokens.

## Installation

The Nest 11/12 contract is prepared for the **unreleased Forms 0.11 minor**, with `@anarchitects/forms-ts@^0.11.0`. The `0.10.x` line remains available for Nest 11 maintenance. Forms also requires Common Mailer `^0.5.0`; release Common 0.5 before Forms 0.11. Do not ship these dependency-floor changes as a patch on the previous minor.

```bash
npm install @anarchitects/forms-nest @nestjs/common @nestjs/config @nestjs/platform-fastify @nestjs/typeorm typeorm
# or
yarn add @anarchitects/forms-nest @nestjs/common @nestjs/config @nestjs/platform-fastify @nestjs/typeorm typeorm
```

Peer requirements:

- `@nestjs/common`, `@nestjs/config`, `@nestjs/platform-fastify`, `@nestjs/typeorm`
- `typeorm`

The TypeORM 1 package line requires Node.js
`^20.19.0 || ^22.13.0 || >=24.11.0`, `@nestjs/typeorm@^11.0.1 || ^12.0.2`, and
`typeorm@^1.1.0`.

The internal `@anarchitects/forms-ts` and `@anarchitects/common-nest-mailer` packages are installed transitively. Common Mailer requires `@nestjs-modules/mailer@^3.0.2` and `nodemailer@^8.0.5`, including when Forms selects `noop`. Noop avoids transport configuration and delivery, not installation of the mandatory dependency graph.

### Nest 11/12 compatibility (#466)

Supported peers are Nest common/platform-fastify `^11.1.6 || ^12.1.2`, Config `^4.0.2 || ^12.0.1`, Nest TypeORM `^11.0.1 || ^12.0.2`, and TypeORM `^1.1.0`. Keep Nest common/core/platform/testing on the same major. The older integration packages themselves exclude Nest 12.

| Consumer        | Nest   | Config | Nest TypeORM | Fastify |
| --------------- | ------ | ------ | ------------ | ------- |
| `nest11`        | 11.1.6 | 4.0.2  | 11.0.1       | 5.4.0   |
| `nest11-modern` | 11.1.6 | 12.0.1 | 12.0.2       | 5.12.5  |
| `nest12`        | 12.1.2 | 12.0.1 | 12.0.2       | 5.12.5  |

The joint Forms/Identity hosts use TypeORM 1.1.0, PostgreSQL 16, Mailer 3.0.2 and Nodemailer 8.0.5. Identity itself has no mailer dependency. They compile strict NodeNext CJS/ESM consumers without `skipLibCheck`, exercise every Nest layer, run exported migrations with `synchronize: false`, and verify facade, config-driven and advanced composition. HTTP checks cover Forms definitions/submissions and Identity create/read/update, validation and not-found responses. Data persists through app restarts; Forms mail is captured through Nodemailer/Handlebars or disabled with `noop`.

**Breaking upgrade requirements:** Forms 0.11 requires Forms TS 0.11 and Common Mailer 0.5 with its Mailer 3/Nodemailer 8 stack. Public facade and secondary entry points remain unchanged. The shared TS package now emits explicit `.js` relative specifiers so its declarations work with strict NodeNext consumers; its ESM/CJS bundle formats remain unchanged.

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

## Usage

### Quick start

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonMailerModule, mailerConfig } from '@anarchitects/common-nest-mailer';
import { FormsModule } from '@anarchitects/forms-nest';
import { formsConfig } from '@anarchitects/forms-nest/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mailerConfig, formsConfig],
    }),
    CommonMailerModule.forRootFromConfig(),
    FormsModule.forRoot({
      mailer: { provider: 'node' },
    }),
  ],
})
export class AppFormsModule {}
```

`FormsModule.forRoot(...)` is the preferred integration path when you want the complete forms stack with minimal host-module wiring.

Prefer `FormsModule.forRootFromConfig()` when you want behavior driven purely by
`FORMS_*` environment variables loaded via `formsConfig`.

Disable mailer integration per domain:

```typescript
FormsModule.forRoot({
  mailer: { provider: 'noop' },
});
```

Then register the module in your application bootstrap (together with your database configuration,
and root mailer setup when the mailer feature is enabled). The presentation controllers expose:

- `GET /forms/:formId` – resolves form definitions and JSON schema payloads.
- `POST /forms/submit` – validates the request body against `SubmissionRequestSchema`, stores
  the payload, and triggers mail notifications through the mailer port.
- `GET /forms/submissions` – returns an array of submission response DTOs. Optional `formId`
  and positive-integer `formVersion` query parameters filter the collection, individually
  or together. No matches return `[]`; omitted filters list all submissions.
- `GET /forms/submissions/:submissionId` – returns one submission response DTO by UUID,
  or 404 when absent. Invalid UUIDs and invalid list filters return 400.

Read responses use ISO date strings for `createdAt` and `updatedAt`, and include `id`,
`formId`, `formVersion`, and `payload`. For example, use
`GET /forms/submissions?formId=contact&formVersion=2` to inspect one form version.
The read routes do not load form definitions or trigger delivery notifications.
Host applications own authorization for accessing stored submission payloads.

**Compatibility:** `submissions` is now reserved under `/forms`, so it cannot also be used
as a form-definition ID at `GET /forms/:formId`. Custom `SubmissionsRepository` adapters
must honor the optional `SubmissionFilters` argument to `getSubmissions()`; existing calls
without filters continue to list all submissions. Submission writes are unchanged.

## Layered composition (advanced)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonMailerModule, mailerConfig } from '@anarchitects/common-nest-mailer';
import { FormsApplicationModule } from '@anarchitects/forms-nest/application';
import { FormsPresentationModule } from '@anarchitects/forms-nest/presentation';
import { FormsInfrastructurePersistenceModule } from '@anarchitects/forms-nest/infrastructure-persistence';
import { FormsInfrastructureMailerModule } from '@anarchitects/forms-nest/infrastructure-mailer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mailerConfig, formsConfig],
    }),
    CommonMailerModule.forRootFromConfig(),
    FormsApplicationModule.forRoot({
      persistence: { persistence: 'typeorm' },
    }),
    FormsInfrastructurePersistenceModule.forRoot({ persistence: 'typeorm' }),
    FormsInfrastructureMailerModule.forRoot({
      provider: 'node',
    }),
    FormsPresentationModule.forRoot({
      application: {
        persistence: { persistence: 'typeorm' },
      },
    }),
  ],
})
export class AppFormsModule {}
```

Use layered composition when you need to swap or selectively compose infrastructure/application concerns.

## Mailer Migration Note

- `FormsInfrastructureMailerModule` is adapter-only and wraps shared `CommonMailerModule.forRoot(...)` behavior.
- Configure transport once at app root with `CommonMailerModule`.
- `FormsModule.forRoot({ mailer: { provider: 'noop' } })` uses the shared no-op adapter from `@anarchitects/common-nest-mailer`.
- The shared mailer DI contract is `MailerPort` and shared concrete adapter is `NodeMailerAdapter` from `@anarchitects/common-nest-mailer`.

## Customising infrastructure

- **Replace persistence:** Bind your own implementation to `SUBMISSIONS_REPOSITORY` if you do not
  use TypeORM. Your adapter should extend or fulfil the `SubmissionsRepository` abstract class.
- **Swap mailer provider:** Provide a custom implementation for `MailerPort` to integrate with your
  preferred email service. The included `FormsInfrastructureMailerModule` wraps shared `CommonMailerModule` provider wiring (which uses `@nestjs-modules/mailer`), but any
  adapter that implements `MailerPort` will work.
- **Extend application services:** The exported `FormsService` and `SubmissionsService` can be
  injected elsewhere to compose additional workflows, while keeping API behavior consistent.

## Development notes

- Keep route schemas sourced from shared TS DTO libraries and avoid inline schema drift.
- Configure shared infrastructure at app root; keep domain infrastructure modules adapter-thin.
- Preserve layered boundaries (`presentation -> application <- infrastructure`) when extending modules.

## License

Released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
