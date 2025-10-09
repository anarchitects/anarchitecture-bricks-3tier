# 🧠 Copilot Instructions – Anarchitecture Bricks 3-Tier

This repository provides contracts-first, libraries-only bricks, organized by domain and technology.
Copilot must follow the conventions below when generating, moving, or updating code.

## 🔩 Global Rules

- Never create apps in this repo — only libs/ and contracts/.
- Each domain has one package per tech stack:
- @anarchitects/{domain}-ts
- @anarchitects/{domain}-angular
- @anarchitects/{domain}-nest
- Each package uses subpath exports to separate layers (e.g. /application, /presentation, /infrastructure-\*, /config, /state).
- Contracts drive everything — contracts/openapi.yaml is the source of truth.
- Always use generated DTOs, schemas, and API clients — never hand-code HTTP or duplication.
- Enforce the 3-tier pattern in every stack, plus optional config and state layers.

## 🧱 Layering by Tech

### 🅰️ Angular (Frontend)

| Layer        | Subpath      | Responsibility                                                                                      |
| ------------ | ------------ | --------------------------------------------------------------------------------------------------- |
| ui/          | /ui          | Presentational components (standalone, dumb). No logic or HTTP.                                     |
| feature/     | /feature     | Smart orchestration and use-case logic. Defines ports for data access.                              |
| data-access/ | /data-access | Implements feature ports using generated OpenAPI clients. Handles HTTP, error mapping, and facades. |
| state/       | /state       | Domain Signal Store — manages reactive state (signal, computed). Consumed by feature and ui.        |
| config/      | /config      | Provides InjectionTokens (API_BASE_URL, DEFAULT_PAGE_SIZE) and provide{Domain}Config() helpers.     |
| util/        | /util        | Pure helper functions, formatters, mappers.                                                         |

#### Dependency rule:

ui ← feature ← state ← data-access ← config ← dtos/models
Never reverse or skip layers.

⸻

### 🦄 NestJS (Backend)

| Layer             | Subpath                                                | Responsibility                                                                                                              |
| ----------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| application/      | /application                                           | Use-case services and ports (abstract classes & tokens). No infrastructure dependencies.                                    |
| presentation/     | /presentation                                          | Controllers, routing, and DTO mapping. Imports application, never infrastructure.                                           |
| infrastructure-\* | /infrastructure-persistence, /infrastructure-mailer, … | Implements application ports (DB, mail, APIs). Must not depend on presentation.                                             |
| config/           | /config                                                | Typed configuration layer. Exports registerAs() config and optional ConfigModule. No direct environment reads outside here. |
| util/             | /util                                                  | Pure, framework-agnostic helpers.                                                                                           |

#### Dependency rule:

presentation → application ← infrastructure
config is imported by infrastructure or the app composition root.

### 🧩 Shared TypeScript (Common)

| Layer       | Subpath     | Responsibility                                                  |
| ----------- | ----------- | --------------------------------------------------------------- |
| dtos/       | /dtos       | Data Transfer Objects (TypeBox or Zod). Generated from OpenAPI. |
| models/     | /models     | Domain entities and interfaces.                                 |
| validators/ | /validators | Schema validators and transformation helpers.                   |
| messaging/  | /messaging  | Domain events (use past tense).                                 |
| util/       | /util       | Shared functional utilities.                                    |

### 🧬 Polyglot Extensions

| Tech         | Location              | Notes                                      |
| ------------ | --------------------- | ------------------------------------------ |
| Rails        | libs/{domain}/rails   | Service objects and ActiveRecord adapters. |
| Laravel      | libs/{domain}/laravel | Service classes and Eloquent adapters.     |
| Other stacks | libs/{domain}/{tech}  | Follow same 3-tier + config convention.    |

### 📜 Contracts & Codegen

- Treat contracts/openapi.yaml (and optional asyncapi.yaml) as authoritative.
- Generate:
- Schemas → contracts/schemas/
- TypeScript clients → libs/{domain}/angular/src/data-access/generated/
- Ruby/PHP stubs → libs/{domain}/{tech}/generated/
- Contract tests live under tools/contract-tests/.

Copilot **must not modify generated code manually** — only through codegen commands.


### 🧭 Naming & Imports

- TypeScript: @anarchitects/{domain}-{tech}/{subpath}
- Examples:
- @anarchitects/contacts-angular/feature
- @anarchitects/contacts-angular/config
- @anarchitects/contacts-nest/application
- @anarchitects/contacts-nest/infrastructure-persistence
- Ruby gems: anarchitects-{domain}
- PHP packages: anarchitects/{domain}
- Events: use past tense (e.g. ContactCreatedEvent, BookingConfirmedEvent).

### ✅ Do

- Follow dependency direction strictly (UI ← Feature ← State ← Data-access; Presentation → Application ← Infrastructure).
- Use generated DTOs and shared models (common-ts-\*).
- Define ports in Application/Feature layers, implement them in Infrastructure/Data-access.
- Use typed configuration in /config, not hardcoded env reads.
- Store domain state in /state using Angular signals, not global stores.
- Respect Nx module boundaries and tags.
- Suggest validators/tests when adding new DTOs.
- Keep all libraries publishable and versioned per tech.

### 🚫 Don’t

- Create any apps/ or bootstrap files.
- Mix frontend and backend code in one library.
- Import infrastructure directly into presentation/controllers.
- Hardcode API URLs or secrets.
- Duplicate or override contract-generated DTOs.
- Commit generated code without running the generator.
- Mix Angular/Nest code into Rails or Laravel slices.
- Add external state managers (no NgRx, Akita, etc.) — use signals.

### ⚙️ Example Imports

**Angular**
```ts
import { provideContactsConfig } from '@anarchitects/contacts-angular/config';
import { ContactsFacade } from '@anarchitects/contacts-angular/feature';
import { ContactsStore } from '@anarchitects/contacts-angular/state';
import { provideContactsDataPort } from '@anarchitects/contacts-angular/data-access';
```
**NestJS**

```ts
import { ContactsApplicationModule } from '@anarchitects/contacts-nest/application';
import { ContactsPresentationModule } from '@anarchitects/contacts-nest/presentation';
import { ContactsPersistenceModule } from '@anarchitects/contacts-nest/infrastructure-persistence';
import { ContactsConfigModule } from '@anarchitects/contacts-nest/config';

```

### 🧱 Summary of Layers

| Layer            | Exists In | Purpose                               |
|------------------|-----------|---------------------------------------|
| ui               | Angular   | Presentation (components)             |
| feature          | Angular   | Orchestration, facades, ports         |
| state            | Angular   | Signal store (domain state)           |
| data-access      | Angular   | HTTP adapters, OpenAPI clients        |
| config           | Angular/Nest | Typed configuration               |
| application      | Nest      | Use-cases, ports                      |
| presentation     | Nest      | Controllers                           |
| infrastructure-* | Nest      | Implement ports (DB, mail, etc.)      |
| common           | TS        | DTOs, models, validators              |


**Copilot’s primary goal:**
Generate modular, contract-driven code consistent with the 3-tier structure, using typed config and reactive state patterns — never apps, always reusable bricks.
