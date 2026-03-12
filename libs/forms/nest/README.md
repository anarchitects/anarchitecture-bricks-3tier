# @anarchitects/forms-nest

NestJS bricks that expose the Forms platform implementation through layered modules. The library ships
application services, HTTP controllers, and infrastructure adapters so a NestJS host can fetch form
definitions and accept submissions without re-implementing domain logic.

## Entry points

| Entry point                                           | Responsibility                                                                                                         |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `@anarchitects/forms-nest`                            | `FormsModule.forRoot(...)` and `FormsModule.forRootFromConfig(...)` facade for full-stack composition                  |
| `@anarchitects/forms-nest/application`                | Use-case services plus the `FormsApplicationModule`, along with DI tokens for repository and mailer ports.             |
| `@anarchitects/forms-nest/presentation`               | Fastify-ready controllers that serve `/forms/:formId` and `POST /forms/submit`, delegating to the application layer.   |
| `@anarchitects/forms-nest/infrastructure-persistence` | `FormsInfrastructurePersistenceModule.forRoot({ persistence: 'typeorm' })` — configurable persistence adapter.         |
| `@anarchitects/forms-nest/infrastructure-mailer`      | `FormsInfrastructureMailerModule`, `NestMailerAdapter` — domain wrapper over shared common node mailer implementation. |
| `@anarchitects/forms-nest/config`                     | `formsConfig`, `FormsConfig`, `InjectFormsConfig()`, and public module option types for root + secondary modules.      |

You can combine these layers or swap infrastructure modules with custom implementations that respect
the exported tokens.

## Installation

```bash
npm install @anarchitects/forms-nest @anarchitects/forms-ts @anarchitects/common-nest-mailer @nestjs/typeorm typeorm @nestjs-modules/mailer
# or
yarn add @anarchitects/forms-nest @anarchitects/forms-ts @anarchitects/common-nest-mailer @nestjs/typeorm typeorm @nestjs-modules/mailer
```

`@anarchitects/forms-ts` provides the DTOs and models referenced by the Nest modules and should be
installed alongside the bricks.

## Quick start

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
      mailer: { features: { enabled: true } },
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
  mailer: { features: { enabled: false } },
});
```

Then register the module in your application bootstrap (together with your database configuration,
and root mailer setup when the mailer feature is enabled). The presentation controllers expose:

- `GET /forms/:formId` – resolves form definitions and JSON schema payloads.
- `POST /forms/submit` – validates the request body against `SubmissionRequestSchema`, stores
  the payload, and triggers mail notifications through the mailer port.

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
      features: { enabled: true },
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

- `FormsInfrastructureMailerModule` is adapter-only and wraps shared `CommonNodeMailerModule` behavior.
- Configure transport once at app root with `CommonMailerModule`.
- `FormsModule.forRoot({ mailer: { features: { enabled: false } } })` uses the shared no-op adapter from `@anarchitects/common-nest-mailer`.
- The shared mailer DI contract is `MailerPort` and shared concrete adapter is `NodeMailerAdapter` from `@anarchitects/common-nest-mailer`.

## Customising infrastructure

- **Replace persistence:** Bind your own implementation to `SUBMISSIONS_REPOSITORY` if you do not
  use TypeORM. Your adapter should extend or fulfil the `SubmissionsRepository` abstract class.
- **Swap mailer provider:** Provide a custom implementation for `MailerPort` to integrate with your
  preferred email service. The included `FormsInfrastructureMailerModule` wraps shared `CommonNodeMailerModule` (which uses `@nestjs-modules/mailer`), but any
  adapter that implements `MailerPort` will work.
- **Extend application services:** The exported `FormsService` and `SubmissionsService` can be
  injected elsewhere to compose additional workflows, while keeping API behavior consistent.

## License

Released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
