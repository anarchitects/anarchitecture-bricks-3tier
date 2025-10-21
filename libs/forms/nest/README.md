# @anarchitects/forms-nest

NestJS bricks that expose the Forms platform contracts through layered modules. The library ships
application services, HTTP controllers, and infrastructure adapters so a NestJS host can fetch form
definitions and accept submissions without re-implementing the contract logic.

## Layered entry points

| Entry point                                           | Responsibility                                                                                                             |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `@anarchitects/forms-nest/application`                | Use-case services plus the `FormsApplicationModule`, along with DI tokens for repository and mailer ports.                 |
| `@anarchitects/forms-nest/presentation`               | Fastify-ready controllers that serve `/forms/:formId` and `POST /submissions/submit`, delegating to the application layer. |
| `@anarchitects/forms-nest/infrastructure-persistence` | TypeORM-backed persistence module that fulfils the submissions repository port.                                            |
| `@anarchitects/forms-nest/infrastructure-mailer`      | MailerModule adapter that fulfils the mailer port using `@nestjs-modules/mailer`.                                          |

You can combine these layers or swap infrastructure modules with custom implementations that respect
the exported tokens.

## Installation

```bash
npm install @anarchitects/forms-nest @anarchitects/forms-ts @nestjs/typeorm typeorm @nestjs-modules/mailer
```

`@anarchitects/forms-ts` provides the DTOs and models referenced by the Nest modules and should be
installed alongside the bricks.

## Quick start

```typescript
// forms.module.ts
import { Module } from '@nestjs/common';
import { FormsApplicationModule } from '@anarchitects/forms-nest/application';
import { PresentationModule } from '@anarchitects/forms-nest/presentation';
import { PersistenceModule } from '@anarchitects/forms-nest/infrastructure-persistence';
import { FormMailerModule } from '@anarchitects/forms-nest/infrastructure-mailer';

@Module({
  imports: [FormsApplicationModule, PersistenceModule, FormMailerModule, PresentationModule],
})
export class FormsModule {}
```

Then register the module in your application bootstrap (together with your database and mailer
configuration). The presentation controllers expose:

- `GET /forms/:formId` – resolves contract-driven form definitions and JSON schema.
- `POST /submissions/submit` – validates the request body against `SubmissionRequestSchema`, stores
  the payload, and triggers mail notifications through the mailer port.

## Customising infrastructure

- **Replace persistence:** Bind your own implementation to `SUBMISSIONS_REPOSITORY` if you do not
  use TypeORM. Your adapter should extend or fulfil the `SubmissionsRepository` abstract class.
- **Swap mailer provider:** Provide a custom implementation for `MAILER_PORT` to integrate with your
  preferred email service. The included `FormMailerModule` wraps `@nestjs-modules/mailer` but any
  adapter that implements `MailerPort` will work.
- **Extend application services:** The exported `FormsService` and `SubmissionsService` can be
  injected elsewhere to compose additional workflows, while keeping contract compliance.

## License

Released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
