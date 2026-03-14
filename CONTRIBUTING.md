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

- Angular: `ui <- feature -> state -> data-access` | `config`, `util`: available to all layers
- Nest: `presentation -> application <- infrastructure` | `config`, `util`: available to all layers

5. Library API paradigm: maximum flexibility + ease of use

- Apply this pattern across publishable libraries, not only one domain.
- Always support both:
  - Easy mode: root facade entry point for minimal host-module setup.
  - Advanced mode: secondary entry points for selective composition and overrides.
- For configurable Nest modules, use dual initialization APIs:
  - `forRoot(options)` for explicit deterministic setup.
  - `forRootFromConfig(overrides?)` for ENV/config-driven setup.
- Keep module configuration in a `config` entry point via `registerAs`, typed config exports, and config-to-options mapper helpers.
- Resolve options consistently as: explicit overrides > config values > defaults.
- Keep shared infrastructure transports configured once at app root and keep domain infrastructure modules adapter-only wrappers.

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
nx run auth-nest-example:contract-test
nx run auth-angular-example:contract-test
nx run forms-nest-example:contract-test
nx run forms-angular-example:contract-test
```

## Pull Requests

- Use Conventional Commits (`feat`, `fix`, `refactor`, `chore`, `docs`, etc.).
- Document API-impacting changes with generated OpenAPI diff output.
- Include contract-test updates when endpoints or response schemas change.

## Release Workflow (Domain Groups)

- Trigger the **Release (Manual)** GitHub Actions workflow from `main`.
- Select exactly one domain group input: `forms`, `auth`, or `common`.
- The workflow runs full `nx release --groups=<domain>` (version, changelog, git/tag, GitHub release, publish).
- Do not run local `nx release` before merging PRs.
- Use **Publish Packages (Recovery)** only if publishing needs to be retried after a failed release run.
- Keep domain tags aligned with folder structure; CI validates:
  - `libs/forms/**` -> `domain:forms`
  - `libs/auth/**` -> `domain:auth`
  - `libs/common/**` -> `domain:shared`

## Testing Expectations

- Unit tests in each library.
- OpenAPI verification and lint checks (`api-specs:*`).
- Contract tests:
  - Nest runtime responses validated against generated OpenAPI.
  - Angular data-access validated against Prism mock built from generated OpenAPI.
- E2E checks run from Nx example applications.
