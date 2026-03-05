# Anarchitecture Bricks - 3-Tier

Modular, reusable libraries and showcase applications for scalable software architectures.

## Purpose

- Publishable domain libraries in `libs/` (TypeScript, Angular, NestJS).
- OpenAPI docs generated from Nest implementation metadata (`@RouteSchema`).
- Shared DTOs/models defined in TypeScript libraries (`libs/*/ts`).
- Technical docs generated with Compodoc and surfaced through Storybook.
- Nx-managed example applications in `examples/` for integration and contract validation.

## Source of Truth

1. Shared model and DTO schemas: `libs/*/ts`.
2. HTTP contract shape: Nest presentation controllers + pure `@RouteSchema` schema fields.
3. OpenAPI metadata (`operationId`, `tags`) is derived in `tools/api-specs/route-metadata.ts`.
4. Generated OpenAPI artifacts: `docs/openapi/openapi.json` and `docs/openapi/openapi.yaml`.

## Repository Structure

```text
libs/
  auth/
    ts/
    angular/
    nest/
  forms/
    ts/
    angular/
    nest/
  common/
  storybook/
  ts/frontend/data-access/

examples/
  forms-angular-example/
  forms-angular-example-e2e/
  forms-nest-example/
  forms-nest-example-e2e/

docs/
  openapi/

tools/
  api-specs/
  angular-docs/
```

## Quickstart

```bash
yarn install

# OpenAPI from implementation
nx run api-specs:generate
nx run api-specs:lint
nx run api-specs:verify

# For route additions/changes:
# update tools/api-specs/route-metadata.ts
# then run nx run api-specs:snapshot for intentional OpenAPI changes

# Angular technical docs
nx run angular-docs:generate

# Storybook (uses merged Compodoc metadata)
nx run storybook-angular:storybook

# Example apps
nx run forms-nest-example:serve
nx run forms-angular-example:serve

# Contract checks
nx run forms-nest-example:contract-test
nx run forms-angular-example:contract-test
```

## Key Nx Targets

| Command                                      | Description                                           |
| -------------------------------------------- | ----------------------------------------------------- |
| `nx run api-specs:generate`                  | Generate OpenAPI JSON/YAML from Nest controllers      |
| `nx run api-specs:lint`                      | Lint generated OpenAPI                                |
| `nx run api-specs:diff`                      | Compare generated OpenAPI against `origin/main`       |
| `nx run api-specs:mock`                      | Run Prism mock server from generated OpenAPI          |
| `nx run api-specs:verify`                    | Validate required endpoints + snapshot stability      |
| `nx run angular-docs:generate`               | Generate and merge Compodoc docs                      |
| `nx run storybook-angular:build-storybook`   | Build Storybook with technical docs metadata          |
| `nx run forms-nest-example:contract-test`    | Validate Nest runtime responses against OpenAPI       |
| `nx run forms-angular-example:contract-test` | Validate Angular data-access calls against Prism mock |
| `nx affected -t lint test build`             | Standard affected checks                              |

## Layering Rules

- Angular: `ui <- feature <- state <- data-access <- config`
- Nest: `presentation -> application <- infrastructure`
- Shared TS: framework-agnostic DTOs/models/builders/utilities

## Documentation Tooling

- Storybook remains the default UI documentation and interaction surface.
- Compodoc provides Angular technical API metadata and pages.
- OpenAPI provides HTTP contract documentation derived from implementation.

## License

MIT
