# Nest Guide

## Intent

This guide describes how to compose NestJS applications from Anarchitecture Bricks while preserving strict backend layering and producing stable contracts for Angular design/UI consumers.

For shared cross-stack design and UI contracts, also use the [Design/UI Systems Guide](/guides/design-ui-systems.html).

## Architecture

- Nest libraries follow: `presentation -> application <- infrastructure`.
- Shared contracts (DTOs/models/schemas) come from `@anarchitects/*-ts`.
- Domain modules expose both facade imports and secondary entry points.
- Controllers must keep `@RouteSchema` fields pure and imported from shared DTO/schema packages.
- OpenAPI metadata remains centralized in specs tooling, not inside controllers.

## Module Composition

Use one of two integration styles:

1. **Facade mode**: import root module and call `forRoot(...)` for fast setup.
2. **Advanced mode**: compose `application`, `presentation`, and infrastructure modules individually for targeted overrides.

Prefer facade mode for host applications by default. Use advanced composition only when replacing persistence/mailer adapters, layering custom modules, or integrating alternative infrastructure.

## Configuration

- Use typed `registerAs(...)` config exports from each domain/config entry point.
- Prefer `forRootFromConfig(...)` when runtime behavior is environment-driven.
- Maintain consistent precedence: explicit overrides > config values > defaults.
- Keep secrets and runtime values in host app config, not in domain logic.
- Configure shared transports once at app root (mailer, etc.), then keep domain modules adapter-thin.

## UI Contract Support

Nest modules should explicitly support frontend design/UI systems by returning stable, implementation-aligned contracts:

- Preserve schema compatibility for frontend rendering surfaces (forms, auth flows, validation payloads).
- Keep DTO/schema evolution additive when possible to avoid breaking Angular UI composition/layout expectations.
- Keep endpoint semantics deterministic so state and layout selection logic can stay in frontend layers.
- Avoid leaking backend persistence details into API contracts consumed by `@anarchitects/*-angular`.

Practical cross-stack guidance:

- `@anarchitects/forms-nest` should continue exposing predictable form definition/submission contracts that Angular feature/UI layers can render dynamically.
- `@anarchitects/auth-nest` should keep auth lifecycle contracts stable so Angular state/feature layers can orchestrate policies and session flows consistently.
- Treat OpenAPI output as the source for client sync; frontend layers depend on it for contract-safe rendering.

## Contract Design for UI Consumers

Design backend contracts as UI-facing building blocks:

- Keep field names and structures stable across versions when consumed by `@anarchitects/forms-angular` and `@anarchitects/auth-angular`.
- Return explicit enums/flags that allow frontend layout or state decisions without brittle string parsing.
- Keep validation and error payload shapes predictable so UI primitives can render consistent feedback.
- Avoid backend-specific persistence implementation details in response DTOs.

## Schema Evolution and Compatibility

Follow a compatibility-first change strategy:

- Add new optional fields before introducing required replacements.
- Deprecate fields in docs first, then remove only after consumer migration windows.
- Keep existing endpoints behaviorally stable while introducing new capabilities.
- Coordinate contract updates through shared TS DTO packages and OpenAPI regeneration in one change-set.

## Forms and Auth Contract Mapping

Cross-stack mapping guidance:

- Forms domain:
  keep form definition and submission contracts stable so Angular runtime layouts (`form:*`, `list:*`, `detail:*`) keep rendering without custom edge logic.
- Auth domain:
  keep lifecycle routes (register/login/logout/refresh/activate/reset) consistent so Angular state and policy guards remain deterministic.
- Both domains:
  keep contract changes synchronized with `@anarchitects/*-ts` and frontend client updates.

## Infrastructure Boundaries

- Keep infrastructure modules adapter-focused and thin.
- Avoid cross-domain TypeORM relations in entities; use scalar foreign keys and integration schemas for cross-domain FK constraints.
- Keep domain internals isolated behind exported tokens/contracts.
- When cross-domain reads are needed, use application composition or dedicated query integrations, not cross-domain entity relations.

## Design/UI-System Aware API Evolution

When changing backend behavior that influences UI composition:

- Update shared TS contracts first (`@anarchitects/*-ts`), then implementation.
- Regenerate OpenAPI and validate downstream client/generator outputs.
- Ensure route schema changes preserve clear migration paths for Angular feature/UI consumers.
- Keep response payloads explicit enough for frontend layout/composition decisions, but free of presentation styling concerns.

## Cookbook for UI-Impacting Backend Changes

- Change: add UI-facing field to existing response
  Update shared DTO, update controller schema import, regenerate OpenAPI, update frontend adapter/state mapping, run contract tests.
- Change: new flow endpoint (for example auth recovery extension)
  Add route schema in TS contracts first, implement controller/service, map OpenAPI metadata centrally, then integrate frontend feature/state.
- Change: forms payload evolution
  Introduce additive fields and keep existing schema keys valid until frontend migration is complete.
- Change: mailer or persistence adapter swap
  Keep facade contracts unchanged; limit changes to infrastructure wiring.

## Contract Verification Workflow

- Validate route schemas remain imported from shared TS DTO libraries (no inline drift).
- Run OpenAPI generation and inspect diff for breaking changes.
- Run frontend contract consumers against updated clients for forms/auth critical paths.
- Run docs checks to keep guidance aligned:
  `yarn nx run docs-hub:validate-content`, `yarn nx run docs-hub:build`, `yarn nx run docs-hub:verify`.

## Common Pitfalls

- Defining OpenAPI metadata directly in controllers instead of centralized metadata mapping.
- Bypassing shared DTO schemas with inline route schema definitions.
- Coupling domain modules to environment access directly.
- Mixing cross-domain persistence relations into runtime entity models.
- Re-implementing transport/provider wiring per domain instead of reusing shared infrastructure bricks.
- Introducing backend contract changes without verifying impact on Angular design/UI rendering flows.
