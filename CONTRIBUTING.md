# Contributing - Anarchitecture Bricks 3-Tier

## Core Rules

1. Implementation-first HTTP docs
- Define API behavior in Nest controllers with pure `@RouteSchema` schema fields only (`body`, `params`, `querystring`, `headers`, `response`).
- Do not set `operationId` or `tags` in controllers; maintain them in `tools/api-specs/route-metadata.ts`.
- Generate OpenAPI via `nx run api-specs:generate`.
- Never hand-edit `docs/openapi/openapi.json` or `docs/openapi/openapi.yaml`.

2. Shared schemas in TypeScript libraries
- Define DTOs and models under `libs/*/ts`.
- Angular and Nest libraries consume these shared types.

3. Library-first architecture
- Keep reusable code in `libs/`.
- Example applications are allowed only under `examples/`.

4. Layer discipline
- Angular: `ui <- feature <- state <- data-access <- config`
- Nest: `presentation -> application <- infrastructure`

## Local Workflow

```bash
yarn install

# API docs pipeline
nx run api-specs:generate
nx run api-specs:lint
nx run api-specs:verify

# If you add/change a route, update:
# tools/api-specs/route-metadata.ts (OPERATION_ID_MAP)
# and run nx run api-specs:snapshot for intentional contract changes

# Library quality checks
nx affected -t lint test build

# Docs and showcases
nx run angular-docs:generate
nx run storybook-angular:storybook
nx run forms-nest-example:contract-test
nx run forms-angular-example:contract-test
```

## Pull Requests

- Use Conventional Commits (`feat`, `fix`, `refactor`, `chore`, `docs`, etc.).
- Document API-impacting changes with generated OpenAPI diff output.
- Include contract-test updates when endpoints or response schemas change.

## Testing Expectations

- Unit tests in each library.
- OpenAPI verification and lint checks (`api-specs:*`).
- Contract tests:
  - Nest runtime responses validated against generated OpenAPI.
  - Angular data-access validated against Prism mock built from generated OpenAPI.
- E2E checks run from Nx example applications.
