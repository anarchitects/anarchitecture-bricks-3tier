# Contributing - Anarchitecture Bricks 3-Tier

## Core Rules

1. Canonical public HTTP contracts and implementation evidence

- Follow [ADR-0016](docs/adr/0016-consume-canonical-public-api-contracts.md) and [Meta ADR-0012](https://github.com/anarchitects/anarchitecture-meta/blob/main/adr/0012-canonical-public-api-contract-ownership.md). Shared public wire schemas and operation definitions are authored Zod-first in [`anarchitecture-contracts`](https://github.com/anarchitects/anarchitecture-contracts); deterministic OpenAPI 3.1 is a published artifact.
- Read the applicable immutable contract version and compatibility rules before API work. Contract changes require upstream review/versioning and coordinated consumer migration, not only a local controller or snapshot edit.
- Preserve current Fastify `@RouteSchema` fields (`body`, `params`, `querystring`, `headers`, `response`) and derive `operationId`/`tags` in `tools/api-specs/route-metadata.ts` from the pinned canonical operation definitions.
- Generate local evidence via `yarn nx run api-specs:generate`; never hand-edit `docs/openapi/openapi.json` or `docs/openapi/openapi.yaml`.
- Contracts extraction and verified 3-tier/DDD adoption precede separate Nest 12-native modernization. Nest 11 remains patch-only; governance acceptance does not mean packages are available or adopted.

2. Domain models and transitional schemas in TypeScript libraries

- Keep domain models, invariants and internal ports in their implementation domains; `auth-ts` retains policy semantics/evaluation. Contracts owns public HTTP representations.
- Existing TypeBox DTOs under `libs/*/ts` remain compatibility material for Angular/Nest consumers. Future bridges must derive from canonical artifacts, without independent Zod/TypeBox authorship.
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

For Nest package changes and release preparation, follow the [packed Nest release validation matrix](docs/guides/nest-release-validation.md). It lists the Nx commands, locked Nest 11/12 consumers, Node minimums and explicit exclusions. The [release plan](docs/guides/nest-compatibility-release-plan.md) records per-package breaking requirements and candidate minors, Newsletter coordination, plugin timing and the current maintenance-branch publication prerequisite.

```bash
yarn install

# Transitional implementation evidence pipeline
nx run api-specs:generate
nx run api-specs:lint
nx run api-specs:diff
nx run api-specs:verify

# IDs/tags derive from immutable canonical operation definitions.
# Compare schema/security differences and run real packed-host HTTP checks.
yarn nx run api-specs:conformance-http

# Library quality checks
nx affected -t lint test build

# Docs and showcases
nx run angular-docs:generate
nx run docs-hub:validate-content
nx run docs-hub:build
nx run docs-hub:verify
nx run storybook-angular:storybook
yarn nx run auth-nest:test-nest-compatibility:nest12
nx run auth-angular-example:contract-test
yarn nx run release-tools:test-forms-identity-nest-compatibility:nest12
nx run forms-angular-example:contract-test

# Docs-surface commit policy check
nx run release-tools:validate-non-bumping-commits
```

## Pull Requests

- Use configured Conventional Commit types and exact Nx project scopes, for example `ci(api-specs)` or `fix(release-tools)`. Domain/release-group names are not scopes. CI checks commits and the PR squash title. Unscoped subjects are reserved for repository-wide work.
- For a new publishable project's implementation PR, use `init(<nx-project-name>): <description>` as the final or squash commit subject. The `init` type is configured with `semverBump: none`, so creating the package does not infer an additional release bump before its explicitly selected first release.
- Document API-impacting changes with the approved canonical contract version/migration, implementation OpenAPI diffs and real HTTP conformance evidence. Follow the [contract workflow](docs/guides/ts-contracts.md).
- Include contract-test updates when endpoints or response schemas change.
- A docs-surface PR changes only files in `docs/**`, `tools/angular-docs/**`, `tools/docs-hub/**`, `libs/**/README.md`, root `README.md`/`CONTRIBUTING.md`, or `.github/workflows/docs-pages.yml`. For these PRs, use non-bumping commit types only: `docs`, `chore`, `ci`, `style`, or `init` when introducing a new publishable project.
- Mixed code/documentation PRs use the commit type and breaking-change markers appropriate to the code changes; updating a README does not make a feature or fix non-bumping.
- Docs-surface PR commits must not contain `!` or `BREAKING CHANGE`.
- CI enforces docs commit policy via `nx run release-tools:validate-non-bumping-commits`.
- CI also enforces docs completeness via `nx run docs-hub:validate-content` (required headings for publishable package READMEs and Angular/Nest markdown guides).
- Squash-merge subject for docs-surface PRs must use `docs:`, `chore:`, `ci:`, `style:`, or `init(<nx-project-name>):` when introducing a new publishable project.

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
- Select exactly one domain group input: `forms`, `auth`, `identity`, `newsletter`, or `common`.
- Newsletter 0.0.1 shipped after #428 acceptance. Preserve coordinated domain publication for its next 0.1 release; follow the [Nest 11/12 release plan](docs/guides/nest-compatibility-release-plan.md).
- Use the optional `bump` workflow input only when you need to override conventional-commit bump inference for that release.
- Use the optional `first_release` workflow input only when the selected release includes a project with no prior release tag.
- A first release is prepared from an `init(<nx-project-name>): <description>` implementation commit. Select `first_release` and an explicit `bump` in the release workflow to choose the initial published version; do not use `feat` merely to introduce the new package because `feat` participates in normal bump inference.
- The `common` domain dynamically includes the `common-nest` and `common-tailwind` release groups.
- Use the optional `common_group` selector when a common release must target only one subgroup. The initial Tailwind release uses `common-tailwind`; leaving it at `all` preserves full-domain behavior.
- Automatic downstream release cascades include only groups whose packages all have matching release tags. Untagged or partially released groups are skipped as a whole, even if `first_release` is enabled for another group. Their dependency ranges remain unchanged until their own release preparation.
- An explicitly selected group with missing tags requires `first_release`; first fetch all repository tags to distinguish missing history from an actual initial release. This flag does not authorize first releases of other dependent groups.
- The workflow runs `nx run release-tools:domain-release -- --domain=<domain> --skip-publish --yes`.
- The repo runner also supports `--bump=<init|patch|minor|major|prepatch|preminor|premajor|prerelease>` for one-off manual override of conventional-commit inference. `init` is restricted to a first release whose selected projects already declare `0.0.1`; it publishes that exact version without incrementing it or creating an empty release commit, and tags the accepted current commit instead.
- Do not perform local releases. Only use the repo runner locally with `-d` for a dry run; actual versioning and publication remain CI-owned after human acceptance.
- Each published GitHub release triggers `publish.yml` for that package tag. `publish.yml` is the npm Trusted Publisher workflow; GitHub OIDC supplies short-lived authentication and provenance without an npm token.
- For a publish-only retry, manually run **Publish** with the existing package tag. Do not rerun versioning.
- Domain major and minor lines stay synchronized while patch versions may diverge. With Nx's pre-1.0 adjustment, use `bump=major` to advance a `0.x` domain to its next minor line.
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
- `nx run release-tools:validate-angular-package-compatibility` ensures every public Angular package
  has dual-major peer coverage and belongs to a supported release group.
- For local dry-run validation, use the repo runner (for example `yarn nx run release-tools:domain-release -- --domain=forms -d`).
- If you need to override the inferred bump for a single release, use the same runner, for example `yarn nx run release-tools:domain-release -- --domain=auth --bump=patch -d`.
- If that release also introduces a package with no prior tag, add `--first-release`, for example `yarn nx run release-tools:domain-release -- --domain=auth --bump=patch --first-release -d`.
- To rehearse the initial Tailwind release without touching other common groups, run `yarn nx run release-tools:domain-release -- --domain=common --group=common-tailwind --bump=init --first-release -d`. The guarded `init` bump publishes Tailwind's already-declared `0.0.1` without incrementing it. Its already-merged implementation used `feat(tailwind)` before the `init` convention was documented; do not rewrite shared history to correct that historical exception.
- Keep domain tags aligned with folder structure; CI validates:
  - `libs/forms/**` -> `domain:forms`
  - `libs/auth/**` -> `domain:auth`
  - `libs/identity/**` -> `domain:identity`
  - `libs/common/**` -> `domain:shared`

## Testing Expectations

- Unit tests in each library.
- OpenAPI verification and lint checks (`api-specs:*`).
- Transitional checks retain Nest runtime validation against local generated OpenAPI and Angular data-access against its Prism mock. These do not establish canonical adoption.
- Adoption additionally requires comparison to the same pinned canonical OpenAPI version, real positive/negative/security HTTP tests and packed-consumer/client verification; track capability/version support explicitly.
- E2E checks run from Nx example applications.

### Passkey browser contracts

With Docker running, install Chromium using `yarn playwright install chromium`, then
run `yarn nx run auth-angular-example-e2e:passkey-contract-test`. This uses a
disposable PostgreSQL database and the native Chromium virtual authenticator. See
the [passkey integration guide](docs/guides/auth-passkeys.md#contract-validation) for
coverage, the default port, and related verifier/persistence tests.

## CI checks and optional local hooks

See [CI and Nx execution policy](docs/ci-strategy.md) for check placement,
remote caching and distribution boundaries, and optional pre-commit/pre-push
feedback. CI remains authoritative; no hooks are installed automatically.

Canonical artifacts, compatibility reviews and actual Nx version floors follow
[the conformance/release guide](docs/guides/canonical-conformance.md).
