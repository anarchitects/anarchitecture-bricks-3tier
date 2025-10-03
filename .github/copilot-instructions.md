# Copilot Instructions – Anarchitecture Bricks 3Tier

This repository is **libraries-only** and **contracts-first**.  
Copilot must follow the conventions below when generating or modifying code.

---

## Global Rules

- **Never create apps** in this repo.
- Work only inside `libs/` and `contracts/`.
- Treat `contracts/openapi.yaml` as the **source of truth** for API definitions.
- Always generate API clients/stubs from the contract, never hand-code raw clients.
- Respect **3-tier layering** in every stack.

---

## Layering

### Frontend libraries

- **ui/** → Presentational only (no business logic, no HTTP).
- **feature/** → Smart orchestration, state, route resolvers.
- **data-access/** → API facades, signal stores, generated OpenAPI clients.
- **util/** → Pure helpers.

### Backend libraries

- **controllers/** → Framework-agnostic controller interfaces. No business logic.
- **services/** → Business logic interfaces + light implementations. Depend only on common + infra ports.
- **infrastructure/** → Adapters: DB, mail, external APIs. Must not depend on controllers.
- **util/** → Pure helpers.

### Common

- **dtos/** → DTOs (TypeScript + JSON schemas).
- **models/** → Interfaces shared across stacks.
- **validators/** → Validation schemas/tests.
- **messaging/** → Event definitions.

### Polyglot extensions

- **angular/** → Angular-specific UI/feature/data-access components.
- **nest/** → NestJS helpers (decorators, guards, pipes).
- **rails/** → Service objects, ActiveRecord adapters (no routes).
- **laravel/** → Service classes, Eloquent adapters, FormRequests.

---

## Contracts & Codegen

- Generate TS clients into `libs/ts/web/data-access/src/generated/`.
- Rails/Laravel stubs go into `libs/rails/.../generated/` or `libs/laravel/.../generated/`.
- Contract tests live in `tools/contract-tests/`.

Copilot should suggest updates to generated code only via codegen commands (not manual edits).

---

## Naming

- TS imports: `@anarchitects/{slice}`
- Ruby gems: `anarchitects-{slice}`
- PHP composer: `anarchitects/{slice}`
- Events: use past tense (`BookingCreatedEvent`).

---

## Do

- Enforce strict separation (ui ← feature ← data-access).
- Use DTOs/interfaces from `libs/common`.
- Expose ports in `services` and implement them in `infrastructure`.
- Propose validators/tests when adding new DTOs.
- Always respect Nx module boundaries.

---

## Don’t

- Add any `apps/` directories or app bootstraps.
- Hardcode HTTP/fetch calls in `feature` or `ui`.
- Import `infrastructure` directly into `controllers`.
- Duplicate contract definitions in code.
- Mix Angular/Nest code into Rails or Laravel slices.

---
