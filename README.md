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
    angular/design/
      config/
      contracts/
      styles/
      tokens/
    angular/ui-primitives/
      actions/
      contracts/
      feedback/
      form-controls/
      surfaces/
    angular/ui-composition/
      contracts/
      projection/
      templates/
    angular/ui-layouts/
      contracts/
      registry/
      host/
      defaults/
  storybook/
  ts/frontend/data-access/

examples/
  auth-angular-example/
  auth-angular-example-e2e/
  auth-nest-example/
  auth-nest-example-e2e/
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
nx run auth-nest-example:serve
nx run auth-angular-example:serve
nx run forms-nest-example:serve
nx run forms-angular-example:serve

# Contract checks
nx run auth-nest-example:contract-test
nx run auth-angular-example:contract-test
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
| `nx run docs-hub:validate-content`           | Enforce required docs sections for guides and READMEs |
| `nx run storybook-angular:build-storybook`   | Build Storybook with technical docs metadata          |
| `nx run docs-hub:build`                      | Build static docs hub pages                           |
| `nx run docs-hub:verify`                     | Validate docs hub outputs and required links          |
| `nx run release-tools:validate-non-bumping-commits` | Enforce non-bumping commit types for docs-surface PRs |
| `nx run release-tools:domain-release -- --domain=forms -d` | Dry-run the supported domain release workflow         |
| `nx run auth-nest-example:contract-test`     | Validate auth Nest runtime responses against OpenAPI  |
| `nx run auth-angular-example:contract-test`  | Validate auth Angular data-access against Prism mock  |
| `nx run forms-nest-example:contract-test`    | Validate Nest runtime responses against OpenAPI       |
| `nx run forms-angular-example:contract-test` | Validate Angular data-access calls against Prism mock |
| `nx affected -t lint test build`             | Standard affected checks                              |

## Release By Domain

Run releases via the **Release (Manual)** GitHub workflow:

- Workflow input `domain` must be one of: `forms`, `auth`, `common`.
- The workflow runs `nx run release-tools:domain-release -- --domain=<domain> --yes`, which handles versioning, changelog generation, git/tagging, GitHub releases, and publish.
- Use **Publish Packages (Recovery)** only to retry publish if a release run fails after versioning/tagging.
- Release tags must point to a commit reachable from the branch running `nx release`, normally `main`.
- Do not create or push final release tags from a release-prep branch before merge.
- If a release-prep PR is squash-merged after tags were created on the branch, retarget those tags to the merge commit on `main` before running release.

Avoid routine local `yarn nx release`; use the workflow or the repo runner for auditable, controlled domain releases.
If local dry-runs are needed, use the repo runner, for example `yarn nx run release-tools:domain-release -- --domain=forms -d`.

## Layering Rules

- Angular: `ui <- feature -> state -> data-access` | `config`, `util`: available to all layers
- Nest: `presentation -> application <- infrastructure` | `config`, `util`: available to all layers
- Shared TS: framework-agnostic DTOs/models/builders/utilities

## Library Consumption Conventions

- Nest library quick starts should prefer root facade imports (for example `@anarchitects/auth-nest` and `@anarchitects/forms-nest`) for full-stack, minimal-import setup.
- Layer-specific secondary entry points (`/application`, `/presentation`, `/infrastructure-*`, `/config`) remain required and supported for advanced composition and overrides.
- Facade modules must not replace layered architecture internally; they compose layers for ergonomic consumption.
- For configurable Nest modules, prefer dual setup APIs to balance flexibility and ease of use:
  - `forRoot(options)` for explicit deterministic configuration.
  - `forRootFromConfig(overrides?)` for config/ENV-driven configuration (backed by `registerAs` in the config entry point).
- Keep precedence consistent when both inputs exist: explicit overrides > config-derived values > hardcoded defaults.
- Mail transport setup should be centralized once at app root via `@anarchitects/common-nest-mailer` (`CommonMailerModule.forRootFromConfig()` or `forRootAsync(...)`), while domain infrastructure-mailer entry points remain thin wrappers over shared provider wiring via `CommonMailerModule.forRoot(...)`.
- Domain facade modules should expose mailer provider controls (for example `mailer.provider`) so infrastructure adapters can be composed per domain without changing root mail transport setup.

## Documentation Tooling

- Storybook remains the default UI documentation and interaction surface.
- Compodoc provides Angular technical API metadata and pages.
- OpenAPI provides HTTP contract documentation derived from implementation.
- Docs hub static site is generated via `nx run docs-hub:build` and published by `.github/workflows/docs-pages.yml`.
- Markdown guide sources live in `docs/guides/angular.md` and `docs/guides/nest.md`; docs-hub renders them into HTML during build.
- Publishable package `README.md` files are rendered as docs pages under `/packages/<package-slug>/` and linked alongside source README URLs.
- Production docs URL: `https://bricks-3tier.anarchitects.dev` (Storybook under `/storybook`, OpenAPI under `/openapi`).

## Docs PR Commit Policy

- Docs-surface pull requests must use non-bumping commit types only: `docs`, `chore`, `ci`, `style`.
- Do not use `!` or `BREAKING CHANGE` markers in docs-surface commits.
- CI enforces this via `nx run release-tools:validate-non-bumping-commits`.
- For squash merges of docs-surface PRs, use a non-bumping squash subject (`docs:`, `chore:`, `ci:`, or `style:`).

## License

MIT
