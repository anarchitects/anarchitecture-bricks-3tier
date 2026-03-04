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
- Angular: `ui <- feature <- state <- data-access <- config`
- Nest: `presentation -> application <- infrastructure`
10. Use subpath exports per layer.
11. Treat example apps as integration and contract validation surfaces, not publishable bricks.

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
