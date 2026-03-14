# Copilot Instructions - Anarchitecture Bricks 3-Tier

This repository is implementation-first, library-focused, and Nx-driven.

## Global Rules

- Prefer reusable packages in `libs/`.
- Example applications are allowed only under `examples/`.
- Shared DTOs/models live in `libs/*/ts`.
- HTTP documentation is generated from Nest implementation (`@RouteSchema`) into `docs/openapi`.
- Do not hand-edit generated OpenAPI artifacts.
- Use Nx targets for build/test/lint/docs workflows.

## Layering

### Angular

- `ui/`: presentational components only
- `feature/`: orchestration and façade-level behavior
- `state/`: signal-store state management
- `data-access/`: HTTP adapters and API integration
- `config/`: typed providers/tokens
- `util/`: pure helper code

Dependency direction:

`ui <- feature -> state -> data-access` | `config`, `util`: available to all layers

### Nest

- `presentation/`: controllers and route schemas
- `application/`: use-cases and service abstractions
- `infrastructure-*`: adapters (persistence, mailer, external APIs)
- `config/`: typed runtime configuration
- `util/`: pure helper code
- package root (`@anarchitects/<domain>-nest`): facade module for full-stack, minimal-import consumption

Dependency direction:

`presentation -> application <- infrastructure`

### Nest Consumption Pattern

- Prefer root facade module imports in quick starts and examples when the full stack is intended.
- Keep secondary entry points (`/application`, `/presentation`, `/infrastructure-*`, `/config`) available for advanced/partial composition.
- Do not remove existing layered entry points when introducing facade modules.
- Keep presentation modules backward-compatible unless a breaking change is explicitly planned.
- Configure shared transports once at app root (for example mail via `CommonMailerModule`), not inside domain infrastructure modules.
- Keep domain infrastructure modules adapter-only and use facade feature flags (for example `features.mailer`) for optional domain capabilities.

### Shared TS

- `dtos/`: TypeBox DTO contracts
- `models/`: domain models
- `builders/validators/util/`: schema tooling and helpers

## API and Docs Workflow

- Route metadata comes from Nest controllers and `@RouteSchema`.
- Nest controllers must keep `@RouteSchema` pure Fastify schema fields only (`body`, `params`, `querystring`, `headers`, `response`).
- Do not place `operationId` or `tags` in controllers. OpenAPI metadata is owned by `tools/api-specs/route-metadata.ts`.
- Nest controllers must not define inline TypeBox route schemas. Define schemas in domain TS DTO libraries (`libs/<domain>/ts/src/dtos`) and import them into controllers.
- When adding or changing a route, update `tools/api-specs/route-metadata.ts` with the `METHOD + path` operationId mapping.
- Generate and validate OpenAPI with:
  - `nx run api-specs:generate`
  - `nx run api-specs:lint`
  - `nx run api-specs:verify`
- Use `nx run api-specs:diff` to inspect compatibility vs `origin/main`.
- Use `nx run api-specs:mock` for Prism-based mocking.
- Generate Angular technical docs with `nx run angular-docs:generate`.
- Storybook is the default UI documentation front end and consumes Compodoc metadata.

## Release Workflow

- Do not rely on local `nx release` for normal releases.
- Run full releases from GitHub Actions via `.github/workflows/release.yml` (`workflow_dispatch`) with an explicit domain group input.
- Release command model is domain-scoped: `nx release --groups=<domain> --yes`.
- Use `.github/workflows/publish.yml` only as manual recovery to retry publishing when needed.

## New Domain Rule

- If a new domain is created under `libs/<domain>`, you must add a matching release group in `nx.json` within the same workstream.
- You must also update `tools/release/validate-domain-tags.mjs` with the folder-to-tag mapping for that domain.
- Keep `README.md` and `CONTRIBUTING.md` release instructions current when domain groups change.

## Do

- Keep module boundaries clean and tag-aware.
- Add/update tests when changing DTOs, route schemas, or domain behavior.
- Keep example apps in sync with library integration contracts.
- Keep APIs and documentation deterministic and reproducible.

## Don't

- Reintroduce `contracts/openapi.yaml` as source-of-truth.
- Hand-edit generated `docs/openapi/*` files.
- Mix Angular and Nest concerns in the same library layer.
- Add framework-coupled logic into shared TS packages.
