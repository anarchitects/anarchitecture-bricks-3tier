# Packed Nest release validation

This is the reproducible validation gate from [#468](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/468), following [ADR-0011](../adr/0011-verify-nest-runtime-support-independently-of-tooling.md). It covers Auth, Auth Declarations, Common Mailer, Forms, Identity and Newsletter. Package changes from #464–#467 still require the coordinated new minor releases; passing these checks does not publish packages or authorize release. #469 owns publication and maintenance routing, including Newsletter's #428 coordination gate.

## CI matrix and exclusions

[Packed Nest compatibility](../../.github/workflows/nest-compatibility.yml) runs on relevant pull requests and supports manual dispatch. It runs only the package builds, artifact checks and locked consumer hosts; it does not repeat the Angular build, browser suite or full repository CI. Each job builds with Node 24.21.0 and then installs, compiles and executes consumers using the selected runtime. Nx and Testcontainers orchestration remain on the tooling runtime. Each host logs its actual Node version, installed dependency versions and behavioral results; CI uploads the logs even when a host fails.

| Consumer Node | Nest 11 suite                                                                                          | Nest 12 suite                                          |
| ------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| 20.19.0       | Mailer, Forms/Identity, Newsletter; baseline and modern integrations; Newsletter optional-peer absence | Excluded: locked `file-type` 22.1.1 requires Node >=22 |
| 22.13.0       | All hosts                                                                                              | All hosts                                              |
| 24.11.0       | All hosts                                                                                              | All hosts                                              |
| 26.11.1       | All hosts                                                                                              | All hosts                                              |

Auth's locked Kysely 0.29.6 dependency requires Node >=22 on both Nest majors. The combined Auth/Declarations host is therefore explicitly excluded on Node 20; this matrix does not separately certify standalone Auth Declarations there. Node 20 is retained for the eligible Nest 11 package combinations, despite being an older runtime line. The package engine union alone does not guarantee that every admitted peer/dependency combination installs on every Node version. In particular, Auth's existing Node 20 engine claim is not supported by this locked dependency set; #469 must reconcile that claim or select and revalidate a Node-20-compatible dependency set before release. This issue does not narrow published package engines or waive engine checks.

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

Consumer fixtures for Auth, Forms/Identity and Newsletter rehearse the already-planned new minor versions in staging. They first compare source/build contracts, change only the staged package version, pack, and compare the full packed contract. Third-party versions and internal dependency ranges are never rewritten to force installation. The all-six artifact validator additionally packs the unmodified build versions. Before #469 releases, reconcile candidate versions and internal ranges with actual coordinated versioning and rerun the matrix against the release commit.

## Maintaining the gate

### Local verification record

On 2026-10-10, all seven matrix lanes passed locally on macOS arm64: **49 clean packed-host runs**, including the documented Node 20 exclusions. Consumer runtimes were exactly 20.19.0, 22.13.0, 24.11.0 and 26.11.1; matrix orchestration used Node 26.11.1. The 73 release-tool tests and 13 guardrail tests also passed on CI's tooling Node 24.21.0. This is local evidence; the new Linux GitHub Actions workflow still needs its first PR run before its CI status can be reported as green.

### Updating the gate

- Review fixture manifests and lockfiles together when upgrading dependencies. Do not regenerate locks as part of a normal test run.
- Update `tools/release/nest-package-contract.mjs` deliberately when changing supported peers, engines or public exports. Offline regression tests reject metadata drift, missing files and unsupported Node lanes.
- Update `ciLanes` in `tools/testing/nest-compatibility-matrix.mjs` and the workflow matrix together; tests enforce agreement. Keep the tooling runtime separate from consumer floors.
- Docker uses Google's Hub cache on CI to reduce anonymous pull limits for PostgreSQL and Ryuk. Cache misses still fall back to Docker Hub; this does not guarantee unrestricted pulls. Container cleanup remains enabled.
- Require successful relevant matrix runs and the existing repository checks before release. Keep evidence tied to the exact commit; local success alone is not a successful GitHub Actions run. Human review/merge and CI-owned versioning/publishing remain mandatory.
