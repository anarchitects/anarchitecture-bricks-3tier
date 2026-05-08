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
- When contract-driven behavior changes, update the affected package READMEs and any relevant migration guide under `docs/guides/`.

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
nx run api-specs:diff
nx run api-specs:verify

# If you add/change a route, update:
# tools/api-specs/route-metadata.ts (OPERATION_ID_MAP)
# and run nx run api-specs:snapshot for intentional contract changes

# Library quality checks
nx affected -t lint test build

# Docs and showcases
nx run angular-docs:generate
nx run docs-hub:validate-content
nx run docs-hub:build
nx run docs-hub:verify
nx run storybook-angular:storybook
nx run auth-nest-example:contract-test
nx run auth-angular-example:contract-test
nx run forms-nest-example:contract-test
nx run forms-angular-example:contract-test

# Docs-surface commit policy check
nx run release-tools:validate-non-bumping-commits
```

## Pull Requests

- Use Conventional Commits (`feat`, `fix`, `refactor`, `chore`, `docs`, etc.).
- Document API-impacting changes with generated OpenAPI diff output.
- Include contract-test updates when endpoints or response schemas change.
- For docs-surface PRs (`docs/**`, `tools/angular-docs/**`, `tools/docs-hub/**`, `libs/**/README.md`, root docs files, docs workflows), use non-bumping commit types only: `docs`, `chore`, `ci`, `style`.
- Docs-surface PR commits must not contain `!` or `BREAKING CHANGE`.
- CI enforces docs commit policy via `nx run release-tools:validate-non-bumping-commits`.
- CI also enforces docs completeness via `nx run docs-hub:validate-content` (required headings for publishable package READMEs and Angular/Nest markdown guides).
- Squash-merge subject for docs-surface PRs must use `docs:`, `chore:`, `ci:`, or `style:`.

## Human-In-The-Loop Shortlist

See the top-level policy summary in [README.md](README.md#human-in-the-loop-shortlist).

- Humans review all AI-proposed code changes.
- Humans own `git commit`, pull request creation, and pull request merge.
- AI agents must explicitly call out potential breaking changes.
- AI agents must explicitly call out when a bug fix may justify npm package deprecation.
- Deprecation actions are proposed-only until explicit human approval is provided.
- AI agents may suggest commit message options; humans run the final commit command.

## Release Workflow (Domain Groups)

- Trigger the **Release (Manual)** GitHub Actions workflow from `main`.
- Select exactly one domain group input: `forms`, `auth`, `identity`, or `common`.
- Use the optional `bump` workflow input only when you need to override conventional-commit bump inference for that release.
- Use the optional `first_release` workflow input only when the selected release includes a project with no prior release tag.
- The workflow runs `nx run release-tools:domain-release -- --domain=<domain> --yes`.
- The repo runner also supports `--bump=<patch|minor|major|prepatch|preminor|premajor|prerelease>` for one-off manual override of conventional-commit inference.
- Do not run local `nx release` before merging PRs; use the repo runner instead.
- Use **Publish Packages (Recovery)** only if publishing needs to be retried after a failed release run.
- Release tags must point to a commit reachable from the branch running `nx release`, normally `main`.
- Do not create or push final `{projectName}@{version}` release tags from a release-prep branch before merge.
- If a release-prep PR is squash-merged after tags were created on the branch, retarget those tags to the merge commit on `main` before running release.
- Before release PRs, normalize publishable package dependency ranges:
  - `nx run release-tools:normalize-internal-deps`
  - `nx run release-tools:normalize-external-peer-ranges`
  - `nx run release-tools:check-release-tag-ancestry`
  - external peer normalization derives ranges from root `package.json`; exact root versions become major-wide caret peers (for example `21.1.6` -> `^21.0.0`)
- The release tag ancestry check fails when a `{projectName}@{version}` tag exists but points to a commit outside current branch history.
- Group-scoped release preflight runs only the selected release group's ancestry check and builds.
- For local dry-run validation, use the repo runner (for example `yarn nx run release-tools:domain-release -- --domain=forms -d`).
- If you need to override the inferred bump for a single release, use the same runner, for example `yarn nx run release-tools:domain-release -- --domain=auth --bump=patch -d`.
- If that release also introduces a package with no prior tag, add `--first-release`, for example `yarn nx run release-tools:domain-release -- --domain=auth --bump=patch --first-release -d`.
- Keep domain tags aligned with folder structure; CI validates:
  - `libs/forms/**` -> `domain:forms`
  - `libs/auth/**` -> `domain:auth`
  - `libs/identity/**` -> `domain:identity`
  - `libs/common/**` -> `domain:shared`

## Testing Expectations

- Unit tests in each library.
- OpenAPI verification and lint checks (`api-specs:*`).
- Contract tests:
  - Nest runtime responses validated against generated OpenAPI.
  - Angular data-access validated against Prism mock built from generated OpenAPI.
- E2E checks run from Nx example applications.
