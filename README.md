# Anarchitecture Bricks - 3-Tier

Modular, reusable libraries and showcase applications for scalable software architectures.

## Purpose

- Publishable domain libraries in `libs/` (TypeScript, Angular, NestJS).
- OpenAPI docs generated from Nest implementation metadata (`@RouteSchema`).
- Shared DTOs/models defined in TypeScript libraries (`libs/*/ts`).
- Technical docs generated with Compodoc and surfaced through Storybook.
- Nx-managed example applications in `examples/` for integration and contract validation.

## Companion Repo Position

This repository is the 3-tier companion to:

- `anarchitects/anarchitecture-bricks-ddd`

The two repos should align on domain intent and public capability surface, while differing in internal architectural style.

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
  guides/
  adr/

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

| Command                                                       | Description                                           |
| ------------------------------------------------------------- | ----------------------------------------------------- |
| `nx run api-specs:generate`                                   | Generate OpenAPI JSON/YAML from Nest controllers      |
| `nx run api-specs:lint`                                       | Lint generated OpenAPI                                |
| `nx run api-specs:diff`                                       | Compare generated OpenAPI against `origin/main`       |
| `nx run api-specs:mock`                                       | Run Prism mock server from generated OpenAPI          |
| `nx run api-specs:verify`                                     | Validate required endpoints + snapshot stability      |
| `nx run angular-docs:generate`                                | Generate and merge Compodoc docs                      |
| `nx run docs-hub:validate-content`                            | Enforce required docs sections for guides and READMEs |
| `nx run storybook-angular:build-storybook`                    | Build Storybook with technical docs metadata          |
| `nx run docs-hub:build`                                       | Build static docs hub pages                           |
| `nx run docs-hub:verify`                                      | Validate docs hub outputs and required links          |
| `nx run release-tools:validate-non-bumping-commits`           | Enforce non-bumping commit types for docs-surface PRs |
| `nx run release-tools:validate-angular-package-compatibility` | Validate Angular peers and release-group coverage     |
| `nx run release-tools:domain-release -- --domain=forms -d`    | Dry-run the supported domain release workflow         |
| `nx run auth-nest-example:contract-test`                      | Validate auth Nest runtime responses against OpenAPI  |
| `nx run auth-angular-example:contract-test`                   | Validate auth Angular data-access against Prism mock  |
| `nx run forms-nest-example:contract-test`                     | Validate Nest runtime responses against OpenAPI       |
| `nx run forms-angular-example:contract-test`                  | Validate Angular data-access calls against Prism mock |
| `nx affected -t lint test build`                              | Standard affected checks                              |

## Release By Domain

Run releases via the **Release (Manual)** GitHub workflow:

- Workflow input `domain` must be one of: `forms`, `auth`, `identity`, `common`.
- Workflow input `bump` is optional and forces the selected semver bump when conventional-commit inference is not the right source of truth.
- Workflow input `first_release` is optional and should be used only when the selected release includes a project with no prior release tag.
- Introduce a new publishable project with an `init(<project-or-domain>): <description>` implementation commit. `init` has `semverBump: none` in `nx.json`; the workflow's `first_release` and explicit `bump` inputs choose the initial published version without also inferring a feature bump.
- The `common` domain dynamically includes the `common-nest` and `common-tailwind` release groups.
- The optional `common_group` selector narrows a common release to `common-nest` or `common-tailwind`; its default `all` keeps full-domain behavior.
- The workflow runs `nx run release-tools:domain-release -- --domain=<domain> --skip-publish --yes`, which handles versioning, changelog generation, git/tagging, and GitHub releases.
- When conventional-commit inference needs a one-off override, the repo runner also supports `--bump=<init|patch|minor|major|prepatch|preminor|premajor|prerelease>`. The guarded `init` value only applies to first releases already declaring `0.0.1`; it publishes that exact version without incrementing it or creating an empty release commit, and tags the accepted current commit instead.
- Each published GitHub release triggers `publish.yml` for that package tag. `publish.yml` is the npm Trusted Publisher workflow; GitHub OIDC supplies short-lived authentication and provenance without an npm token.
- For a publish-only retry, manually run **Publish** with the existing package tag, for example `auth-nest@0.9.0`. Do not rerun versioning.
- Domain major and minor lines stay synchronized while patch versions may diverge. With Nx's pre-1.0 adjustment, use `bump=major` to advance a `0.x` domain to its next minor line.
- Release tags must point to a commit reachable from the branch running `nx release`, normally `main`.
- Do not create or push final release tags from a release-prep branch before merge.
- If a release-prep PR is squash-merged after tags were created on the branch, retarget those tags to the merge commit on `main` before running release.

Avoid routine local `yarn nx release`; use the workflow or the repo runner for auditable, controlled domain releases.
If local dry-runs are needed, use the repo runner, for example `yarn nx run release-tools:domain-release -- --domain=forms -d`.
If you need to override bump inference for a one-time release, use the same runner, for example `yarn nx run release-tools:domain-release -- --domain=auth --bump=patch -d`.
If the release also includes a package with no prior release tag, add `--first-release`, for example `yarn nx run release-tools:domain-release -- --domain=identity --bump=patch --first-release -d`.
For the initial Tailwind release, use `yarn nx run release-tools:domain-release -- --domain=common --group=common-tailwind --bump=init --first-release -d`; the guarded `init` bump publishes the already-declared `tailwind@0.0.1` without selecting the other common groups or incrementing the version. Tailwind's implementation predates the documented `init` convention and was merged as `feat(tailwind)`; preserve shared history and use the explicit `init` bump for this first release.

## Layering Rules

- Angular: `ui <- feature -> state -> data-access` | `config`, `util`: available to all layers
- Nest: `presentation -> application <- infrastructure` | `config`, `util`: available to all layers
- Shared TS: framework-agnostic DTOs/models/builders/utilities
- Do not split libraries by audience (`admin`, `public`, `backoffice`, etc.) as a default rule; package by capability first and introduce audience-specific libraries only when workflow divergence is real.

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
- Audience and access policy are usually host-app composition concerns; prefer neutral, capability-focused library names and let consuming apps apply route guards, layouts, and page-level orchestration.

## Cross-Repo Alignment Position

This repository should stay aligned with `anarchitecture-bricks-ddd` at the domain/capability level.

Alignment means:

- comparable domain intent
- comparable public capability surface
- traceable mapping between 3-tier packages and DDD package families
- documented migration paths from 3-tier structure to DDD structure

Alignment does **not** mean identical file structure or forced architectural sameness.

## Architecture Guides

- [Guide: Alignment With `anarchitecture-bricks-ddd`](docs/guides/alignment-with-bricks-ddd.md)
- [Guide: Migration To `anarchitecture-bricks-ddd`](docs/guides/migration-to-bricks-ddd.md)
- [Guide: Angular 22 And TypeScript 6 Migration](docs/guides/angular-22-migration.md)

## Architecture Decision Records

- [ADR-0001: Align With `anarchitecture-bricks-ddd` And Support Migration](docs/adr/0001-align-with-bricks-ddd-and-support-migration.md)
- [ADR-0002: Do Not Split Libraries By Audience Until Workflow Divergence Is Real](docs/adr/0002-do-not-split-libraries-by-audience-until-workflow-divergence-is-real.md)
- [ADR-0003: Adopt Tailwind v4 As The Frontend Foundation And Retire Common Angular UI Packages](docs/adr/0003-adopt-tailwind-v4-frontend-foundation-and-retire-common-angular-ui-packages.md)
- [ADR-0004: Define `libs/common` As Platform/Foundation, Not A Shared Dumping Ground](docs/adr/0004-define-common-as-platform-foundation-not-shared-dumping-ground.md)
- [ADR-0005: Define Forms As A Configurable Intake Domain](docs/adr/0005-define-forms-as-configurable-intake-domain.md)
- [ADR-0006: Forms Must Not Replace Typed Domain APIs](docs/adr/0006-forms-must-not-replace-domain-apis.md)
- [ADR-0007: Common Mailer Is Transport Infrastructure Only](docs/adr/0007-common-mailer-is-transport-only.md)
- [ADR-0008: Forms Must Prefer Events Over Embedded Business Logic](docs/adr/0008-forms-event-driven-extension.md)
- [ADR-0009: Forms Admin Features Must Remain Lightweight](docs/adr/0009-forms-admin-scope-limitation.md)

## Documentation Tooling

- Storybook remains the default UI documentation and interaction surface.
- Compodoc provides Angular technical API metadata and pages.
- OpenAPI provides HTTP contract documentation derived from implementation.
- Docs hub static site is generated via `nx run docs-hub:build` and published by `.github/workflows/docs-pages.yml`.
- Markdown guide sources live in `docs/guides/angular.md` and `docs/guides/nest.md`; docs-hub renders them into HTML during build.
- Publishable package `README.md` files are rendered as docs pages under `/packages/<package-slug>/` and linked alongside source README URLs.
- Production docs URL: `https://bricks-3tier.anarchitects.dev` (Storybook under `/storybook`, OpenAPI under `/openapi`).

## Docs PR Commit Policy

- Docs-surface pull requests must use non-bumping commit types only: `docs`, `chore`, `ci`, `style`, or `init` when introducing a new publishable project.
- Do not use `!` or `BREAKING CHANGE` markers in docs-surface commits.
- CI enforces this via `nx run release-tools:validate-non-bumping-commits`.
- For squash merges of docs-surface PRs, use a non-bumping squash subject (`docs:`, `chore:`, `ci:`, `style:`, or `init(<project-or-domain>):` for a new publishable project).

## Human-In-The-Loop Shortlist

See the contributor workflow context in [CONTRIBUTING.md](CONTRIBUTING.md#human-in-the-loop-shortlist).

- Humans review all AI-proposed code changes.
- Humans own `git commit`, pull request creation, and pull request merge.
- AI agents must explicitly call out potential breaking changes.
- AI agents must explicitly call out when a bug fix may justify npm package deprecation.
- Deprecation actions are proposed-only until explicit human approval is provided.
- AI agents may suggest commit message options; humans run the final commit command.

## License

MIT
