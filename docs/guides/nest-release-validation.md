# Packed Nest release validation

This is the reproducible validation gate from [#468](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/468), following [ADR-0011](../adr/0011-verify-nest-runtime-support-independently-of-tooling.md). It covers Auth, Auth Declarations, Common Mailer, Forms, Identity and Newsletter. Package changes from #464–#467 still require the coordinated new minor releases; passing these checks does not publish packages or authorize release. The [release plan](nest-compatibility-release-plan.md) records #469's package versions, publication sequence and maintenance routing constraints, including Newsletter's completed #428 initial release.

## CI matrix and exclusions

[Packed Nest compatibility](../../.github/workflows/nest-compatibility.yml) runs on relevant pull requests and supports manual dispatch. It runs only the package builds, artifact checks and locked consumer hosts; it does not repeat the Angular build, browser suite or full repository CI. Each job builds with Node 24.21.0 and then installs, compiles and executes consumers using the selected runtime. Nx and Testcontainers orchestration remain on the tooling runtime. Each host logs its actual Node version, installed dependency versions and behavioral results; CI uploads the logs even when a host fails.

| Consumer Node | Nest 11 suite                                                                                          | Nest 12 suite                                          |
| ------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| 20.19.0       | Mailer, Forms/Identity, Newsletter; baseline and modern integrations; Newsletter optional-peer absence | Excluded: locked `file-type` 22.1.1 requires Node >=22 |
| 22.13.0       | All hosts                                                                                              | All hosts                                              |
| 24.11.0       | All hosts                                                                                              | All hosts                                              |
| 26.11.1       | All hosts                                                                                              | All hosts                                              |

Auth's locked Kysely 0.29.6 dependency requires Node >=22 on both Nest majors. The combined Auth/Declarations host is therefore explicitly excluded on Node 20; this matrix does not separately certify standalone Auth Declarations there. Node 20 is retained for the eligible Nest 11 package combinations, despite being an older runtime line. The package engine union alone does not guarantee that every admitted peer/dependency combination installs on every Node version. Auth 0.12 therefore narrows its engine metadata to `^22.13.0 || >=24.11.0` in #469. This is a disclosed breaking runtime requirement on the new minor; published 0.11 artifacts are unchanged. Engine checks remain strict.

The matrix samples the declared minimums and Node 26.11.1. It does not certify every patch, odd-numbered Node release, future Node major, operating system or arbitrary combination admitted by semver ranges. CI runs Linux; local results must identify their operating system. Config 4 with Nest 12 is excluded by Config's upstream peers. TypeScript checks use 6.0.3, strict NodeNext, decorator metadata and `skipLibCheck: false`; these are consumer compiler checks, not Nest CLI/plugin support claims.

## Locked host coverage

The Nest 11 suite runs the baseline and modern integration configurations; the Nest 12 suite runs its matching modern integrations. Every included family has a fresh temporary host outside the workspace, a committed npm lock, strict peer/engine checks, `npm ls --all`, and CJS/ESM coverage. Installation never uses overrides, forced peers, workspace dependency symlinks or an inherited module loader. Only registry downloads may be cached; `node_modules` is always freshly installed. Exact versions are recorded in the fixture manifests and locks.

| Family               | Configurations                                                            | Behavior                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Common Mailer        | `nest11`, `nest11-config12`, `nest12`                                     | Facade/config/advanced DI, overrides, noop, in-memory Nodemailer transport and templates                                                                      |
| Auth + Declarations  | `nest11`, `nest11-modern`, `nest12`                                       | Decorator identity, HTTP/auth/guards, config, TypeORM and published adapter, Better Auth/passkey persistence                                                  |
| Forms + Identity     | `nest11`, `nest11-modern`, `nest12`                                       | Facades and advanced composition, Fastify schemas, configuration, mail overrides, PostgreSQL workflows                                                        |
| Newsletter + example | `nest11`, `nest11-modern`, `nest12`, `nest11-optional`, `nest12-optional` | Actual example source, native lifecycle/mail/consent/migrations, MailerLite/webhook raw bytes and signatures, replay/deduplication, disabled/custom providers |

Newsletter's optional hosts install without TypeORM, pg, Common Mailer, Mailer, Nodemailer or Handlebars and exercise runtime composition. They do not certify compiling the entire declaration graph without those optional adapters' type dependencies. Full hosts cover strict declarations with adapters installed.

## Local and pre-release commands

Use the workspace tooling Node version (CI uses 24.21.0), Yarn from `packageManager`, an available npm registry, Docker and PostgreSQL image access. Start with:

```sh
yarn install --immutable
yarn nx run release-tools:test
yarn nx run release-tools:validate-nest-package-compatibility
yarn nx run release-tools:test-typeorm-persistence
```

The artifact validator builds and checks all six packages. It compares source/dist/packed dependencies, complete peer ranges, optional-peer metadata, engines, module/type fields and declaration mappings. It validates Nx-generated layer exports against the expected public entry points and verifies every exported runtime/declaration file exists in the tarball. It also rejects runtime dependencies on Nx or Nest generation tools. `validate-typeorm-package-compatibility` remains available as a three-package subset using the same contract implementation; main/feature CI now runs the complete validator. Neither validator modifies manifests.

Run both suites with the current Node executable, or supply an absolute executable from a separate Node installation:

```sh
yarn nx run release-tools:test-nest-compatibility:nest11
yarn nx run release-tools:test-nest-compatibility:nest12

NEST_HOST_NODE=/absolute/path/to/node-v20.19.0/bin/node yarn nx run release-tools:test-nest-compatibility:nest11
NEST_HOST_NODE=/absolute/path/to/node-v22.13.0/bin/node yarn nx run release-tools:test-nest-compatibility:nest11
NEST_HOST_NODE=/absolute/path/to/node-v22.13.0/bin/node yarn nx run release-tools:test-nest-compatibility:nest12
NEST_HOST_NODE=/absolute/path/to/node-v24.11.0/bin/node yarn nx run release-tools:test-nest-compatibility:nest11
NEST_HOST_NODE=/absolute/path/to/node-v24.11.0/bin/node yarn nx run release-tools:test-nest-compatibility:nest12
NEST_HOST_NODE=/absolute/path/to/node-v26.11.1/bin/node yarn nx run release-tools:test-nest-compatibility:nest11
NEST_HOST_NODE=/absolute/path/to/node-v26.11.1/bin/node yarn nx run release-tools:test-nest-compatibility:nest12
```

The Node installation must include its matching npm executable in the same `bin` directory. `NEST_HOST_NODE` controls npm's runtime, TypeScript and consumer execution; it does not switch Nx's runtime. Optionally set `NEST_HOST_NPM_CACHE` to an absolute download-cache directory to reuse registry downloads across hosts. All matrix targets are uncached and fail on the first failing host within a lane; other CI lanes continue. Known exclusions are logged, and incompatible new locked engine requirements fail before installation. Single-family targets documented in the package READMEs remain available for focused debugging.

The matrix parent starts one temporary Testcontainers network to hold its own Ryuk connection for the entire suite. Hosts still create and stop separate PostgreSQL containers; they do not share the network or databases. Keeping the parent connected avoids a shutdown race when a later host tries to reuse the previous host's Reaper after npm installation or compilation. The parent removes its network in `finally`, including on host failure. Ryuk remains enabled for abnormal-exit cleanup; this does not retry failed tests or suppress container errors.

Consumer fixtures for Auth, Forms/Identity and Newsletter rehearse the already-planned new minor versions in staging. They first compare source/build contracts, change only the staged package version, pack, and compare the full packed contract. Third-party versions and internal dependency ranges are never rewritten to force installation. The all-six artifact validator additionally packs the unmodified build versions. The #469 plan aligns Newsletter TS and Nest staging at 0.1.0, with an exact 0.1.0 internal dependency. Auth 0.12/Forms 0.11/Identity 0.2/Common Mailer 0.5 candidates remain unchanged. Only Auth engine metadata and Newsletter first-party candidate metadata change in the fixture locks; registry resolution/integrities remain frozen. Inspect actual coordinated versioning and rerun the matrix against the versioned release commit.

## Maintaining the gate

### CI and local verification record

On 2026-10-10, all seven matrix lanes passed locally on macOS arm64: **49 clean packed-host runs**, including the documented Node 20 exclusions. Consumer runtimes were exactly 20.19.0, 22.13.0, 24.11.0 and 26.11.1; matrix orchestration used Node 26.11.1. The 73 release-tool tests and 13 guardrail tests also passed on CI's tooling Node 24.21.0. Linux [run 38073619350](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/38073619350) subsequently passed all seven jobs against `cd24fb2aff630e04b5300a287fddc65cb127e73b`, merged in PR #479 as `5972b2f`. Its Corepack/cache-order regression fix brings the release-tools suite to 74 tests. That successful run predates #469's Auth engine correction and Newsletter TS 0.1 staging alignment, so fresh PR/release verification is required for those changes.

On 2026-10-10, #469's Auth engine and Newsletter TS staging changes passed all eight affected host configurations on Node 22.13.0 locally (macOS arm64), the all-six artifact validator, 76 release-tool tests and 13 guardrail tests. Registry lock entries were unchanged. These local results do not replace fresh Linux PR/release checks.

### Updating the gate

- The CI domain-release runner keeps packed-host candidates and their first-party lock entries aligned in the same commit as Nx versioning. It checks the fixtures against the pre-release manifests, then copies only version changes and internal dependency/peer ranges from the versioned manifests. Registry entries, integrity hashes, external ranges, engines and optional-peer metadata remain unchanged; unexpected drift aborts before commit/tag/push. Reviewed future candidates remain in place until source versions catch up. Dry runs and normal host tests do not write fixtures. Common Mailer's standalone host already uses the verified current tarball version; its candidates in the combined hosts follow this same synchronization.
- Auth's 0.13.0 release exposed stale 0.12.0 candidates in release run [38695700242](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/38695700242). The following release stopped in the packed HTTP preflight before versioning. Its repair updates all three Auth hosts to 0.13.0 without changing registry entries or the published packages.
- Review fixture manifests and lockfiles together when upgrading dependencies. Do not regenerate locks as part of a normal test run.
- Update `tools/release/nest-package-contract.mjs` deliberately when changing supported peers, engines or public exports. Offline regression tests reject metadata drift, missing files and unsupported Node lanes.
- Update `ciLanes` in `tools/testing/nest-compatibility-matrix.mjs` and the workflow matrix together; tests enforce agreement. Keep the tooling runtime separate from consumer floors.
- Docker uses Google's Hub cache on CI to reduce anonymous pull limits for PostgreSQL and Ryuk. Cache misses still fall back to Docker Hub; this does not guarantee unrestricted pulls. Container cleanup remains enabled.
- Require successful relevant matrix runs and the existing repository checks before release. Keep evidence tied to the exact commit; local success alone is not a successful GitHub Actions run. Human review/merge and CI-owned versioning/publishing remain mandatory.
