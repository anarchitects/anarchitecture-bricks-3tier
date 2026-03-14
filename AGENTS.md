<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.

<!-- nx configuration end-->

# Agents Instructions - Anarchitecture Bricks 3-Tier

## Role

You are an engineering assistant for an Nx monorepo containing reusable libraries and example applications.

## Allowed Work

- Create, refactor, or remove Nx libraries under `libs/`.
- Create and maintain Nx-managed example applications under `examples/`.
- Update docs (`README.md`, `CONTRIBUTING.md`, and library READMEs).
- Add and maintain TypeBox/Zod DTOs, models, validators, and builders.
- Maintain Nx targets for build/lint/test/docs/publish.
- Maintain OpenAPI generation from implementation under `tools/api-specs` and `docs/openapi`.
- Maintain Compodoc/Storybook docs integration.
- Add tests (unit, contract, e2e) and improve validation quality.

## Forbidden Work

- Do not create or modify any directory under `apps/`.
- Do not manually edit generated OpenAPI artifacts in `docs/openapi/`.
- Do not introduce external dependencies without purpose.
- Do not mix frontend and backend concerns in a single library layer.
- Do not break Nx module boundaries/import rules.
- Do not push directly to `main`.

## Architectural Principles

1. Shared schemas and domain models live in `libs/*/ts`.
2. API documentation is derived from Nest controllers and `@RouteSchema`.
3. Nest controllers must keep `@RouteSchema` pure Fastify schema fields only (`body`, `params`, `querystring`, `headers`, `response`).
4. OpenAPI metadata (`operationId`, `tags`) is assigned centrally in `tools/api-specs/route-metadata.ts` during spec generation.
5. Nest controllers must not define inline TypeBox route schemas; route schemas must be imported from domain TS DTO libraries (`libs/<domain>/ts/src/dtos`).
6. Storybook is the default UI docs experience; Compodoc enriches technical API docs.
7. Keep typed configuration centralized (`registerAs`, injection tokens, provider functions).
8. Keep environment access out of domain logic.
9. Keep dependency direction strict:

- Angular: `ui <- feature -> state -> data-access` | `config`, `util`: available to all layers
- Nest: `presentation -> application <- infrastructure` | `config`, `util`: available to all layers

10. Use subpath exports per layer.
11. Treat example apps as integration and contract validation surfaces, not publishable bricks.
12. For Nest publishable libraries, provide a root "easy mode" facade module for full-stack consumption while preserving layer-specific secondary entry points.
13. Prefer documenting and using root facade modules (`@anarchitects/<domain>-nest`) in quick starts; use secondary entry points for advanced composition/overrides.
14. Configure shared infrastructure transports once at app root (for example mail transport via `CommonMailerModule`) and keep domain infrastructure modules adapter-only wrappers over shared implementations (for example `CommonNodeMailerModule`).
15. When domain infrastructure is optional, expose facade-level feature flags (for example `features.mailer`) and provide safe no-op behavior for disabled features.

## Library API Paradigm (Maximum Flexibility + Ease of Use)

- Apply this paradigm to all publishable libraries, not only a single domain.
- Provide an easy mode and an advanced mode simultaneously:
  - Easy mode: a root facade module/entry point for minimal host wiring.
  - Advanced mode: secondary entry points with composable modules/services for targeted overrides.
- For configurable Nest modules, prefer dual initialization APIs:
  - `forRoot(options)`: explicit, deterministic, and environment-agnostic.
  - `forRootFromConfig(overrides?)`: environment/config-driven via `registerAs` in the config entry point.
- Keep configuration centralized in the `config` secondary entry point:
  - own `registerAs` namespace and typed config export.
  - expose config-to-options mappers used by module composition.
- Use consistent precedence when resolving options:
  - explicit overrides > config-derived values > hardcoded defaults.
- Keep infrastructure wrappers thin and adapter-focused; shared infrastructure transports should be configured once at app root.
- Ensure docs and tests cover both consumption paths:
  - quick start via facade/easy mode.
  - advanced composition via secondary entry points.
  - deterministic behavior checks for both `forRoot` and `forRootFromConfig`.

## Preferred Commands

- `nx run <project>:lint`
- `nx run <project>:test`
- `nx run <project>:build`
- `nx run api-specs:generate|lint|verify|diff|mock`
- `nx run angular-docs:generate`
- `nx run forms-nest-example:contract-test`
- `nx run forms-angular-example:contract-test`

## Expected Output Quality

- Production-ready code and docs.
- Deterministic, reproducible targets.
- Passing lint/build/test for affected scope.
- Consistent architecture boundaries and naming.

## Release Workflow Rules

- Release ownership is CI-based via GitHub Actions, not local developer machines.
- Trigger releases using `.github/workflows/release.yml` (`Release (Manual)`), selecting exactly one domain group (`forms`, `auth`, or `common`).
- The release workflow runs full `nx release --groups=<domain> --yes` (versioning, changelog/release notes, git commit/tag/push, GitHub release, publish).
- Use `.github/workflows/publish.yml` (`Publish Packages (Recovery)`) only for manual publish retries after a failed release run.
- Do not run routine local `nx release` before merging PRs.

## New Domain Onboarding Rule

- Whenever a new domain is introduced under `libs/<domain>`, update `nx.json` release groups to add that domain group before or in the same change.
- Ensure the new group uses the established release model (domain-scoped and explicit targeting).
- Update `tools/release/validate-domain-tags.mjs` so folder-to-domain-tag validation includes the new domain mapping.
- Keep release docs (`README.md`, `CONTRIBUTING.md`) aligned with any new release group additions.
