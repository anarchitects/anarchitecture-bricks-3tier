# Nest development and maintenance strategy

This is the implementation strategy for [#463](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/463), following the [#462 audit](nest-11-12-compatibility-audit.md) and [ADR-0011](../adr/0011-verify-nest-runtime-support-independently-of-tooling.md). Decision date: 2026-10-09.

## Workspace decision

Keep the root workspace on its locked **Nest 11.1.6**, Nx **23.2.1**, TypeScript **6.0.3** and Yarn **4.18.0** while the individual package issues are implemented. Develop against Nest 12 using the isolated, locked host below. This permits each package change to remain a separate reviewable PR; upgrading the root does not substitute for a package's own compatibility checks.

The intended Nest 12 development track uses **Nest 12.1.2** and `@anarchitects/nest` for native Nest CLI integration when its adoption gates are satisfied. Existing build outputs and tests retain explicit ownership. The current root `package.json`, `yarn.lock`, `nx.json` plugin registrations and generator defaults are unchanged by #463.

## Separate release tracks are allowed

The maintainer confirmed that a breaking Nest 12 change may ship on a **new minor line for the current pre-1.0 packages**. Existing Nest 11 minor lines may continue receiving features and fixes. A single package release is not required to advertise both Nest majors. A dual-major peer range remains an option only where the same artifact is verified on both.

- Before switching the main development line to Nest 12, preserve a Nest 11 maintenance branch from the last accepted Nest 11 commit. A proposed name is `maint/nest-11`; branch creation and its release routing are follow-up work, not done by this issue.
- Apply portable fixes/features to both tracks with separate review and validation. Backport behavior, not necessarily identical dependency/configuration changes. Each track must pass its own host and package checks.
- Keep supported package/dependency versions explicit for each line. Do not widen the old Nest 11 artifacts' support claims retrospectively.
- Repository release groups synchronize domain major/minor lines. The human/CI release decision must account for sibling TS/Angular packages and exact internal dependency ranges; do not independently assign an arbitrary Nest-package minor here.
- Under [current release conventions](../../CONTRIBUTING.md#release-workflow-domain-groups), the pre-1.0 adjustment uses a breaking/major bump to advance to the next minor line. Publication remains CI-owned. Before releasing from a maintenance branch, #469 must verify workflow ref support, tag ancestry and dependent-version handling; simply having a branch does not establish a working release path.
- Newsletter still obeys #428's coordinated publication gate.

This is a permitted fallback and maintenance policy, not a decision to force every brick to become Nest-12-only. Dropping Nest 11 in a new artifact, raising runtime Node requirements or changing module exports must be disclosed as breaking for that release line.

## What @nx/nest currently owns

Resolved Nx project configuration shows that the five CommonJS Nest libraries build with `@nx/js:tsc`, declarations builds with Vite, and the Newsletter Nest example builds with Webpack and serves with `@nx/js:node`. Nest library unit tests use `@nx/jest:jest`; additional integration tests use `nx:run-commands`. None of those targets requires replacing its executor with `@anarchitects/nest`.

`@nx/nest` is installed and owns the `@nx/nest:library` generator defaults in `nx.json`. It is not registered as an inferred plugin. There is no `nest-cli.json` in the current repository. Removing the dependency alone would leave stale generator defaults; registering the replacement alone would not adopt any existing project.

### Published plugin constraint verified in #463

[`@anarchitects/nest@0.0.3`](https://registry.npmjs.org/@anarchitects/nest/0.0.3) is available on npm and in [anarchitecture-plugins](https://github.com/anarchitects/anarchitecture-plugins). Its [init generator](https://github.com/anarchitects/anarchitecture-plugins/blob/d8ebdfeaab134b3980179b0e2acb3d52fe84624d/packages/nest/src/generators/init/generator.ts) visits all package manifests. Its [dependency validator](https://github.com/anarchitects/anarchitecture-plugins/blob/d8ebdfeaab134b3980179b0e2acb3d52fe84624d/packages/nest/src/utils/validate-dependencies.ts) checks dependencies, devDependencies, **peerDependencies** and optionalDependencies.

The validator shipped inside the npm 0.0.3 tarball was executed with a Nest 12 root plus a sample library manifest:

| Library common peer    | Result   |
| ---------------------- | -------- |
| `^12.0.0`              | Accepted |
| `^11.0.0`              | Rejected |
| `^11.0.0 \|\| ^12.0.0` | Rejected |

Consequently, even moving root dependencies to Nest 12 would not make initialization accept the current library peers. On a dedicated Nest 12 release track, v12-only library declarations can satisfy this constraint. If any libraries retain dual peers in that workspace, plugin validation needs an upstream change distinguishing installed framework requirements from published compatibility ranges before supported initialization can proceed. Do not narrow runtime peers merely to satisfy the plugin or bypass its validation by hiding manifests.

The plugin requires Node `^22.22.3 || ^24.15.0 || >=26.0.0`, Nx/devkit `>=23.2.0 <24`, Nest CLI `>=12.0.0 <13`, and generation TypeScript `>=6.0.0 <7`. Those are tooling requirements, not new runtime requirements for the bricks.

### Adoption gates and target ownership

1. Finish and review #464–#467 package evidence and decide each new artifact's supported Nest major(s). Establish the Nest 11 maintenance point before changing the primary workspace.
2. On the Nest 12 track, align root common/core/testing/adapters and companion integrations to the audited versions, add stable Nest CLI 12, replace `@nx/nest`, and regenerate the root Yarn lock with the workspace package manager. Validate with an immutable install. Do not copy the isolated npm locks into the Yarn workspace.
3. Resolve the manifest-validation constraint above. Use the plugin's supported initialization path; inspect its dry run and generated changes. Replace obsolete generator defaults only after verifying the replacement schemas. Its source-only ESM library defaults do not replace this repo's publishable-library conventions.
4. Adopt existing Nest applications individually with reviewed `nest-cli.json` configuration. Keep projects under `examples/`; do not create `apps/`. Use distinct inferred names such as `nest-build`/`nest-start` during evaluation to avoid conflicting with explicit `build`/`serve` targets. Select one authoritative build/start path before completing adoption.
5. Preserve `@nx/js:tsc` package exports, additional entry points, declaration emission and release outputs, plus the Vite declarations build. Preserve Nest test decorator metadata and contract targets. Native CLI defaults are not a mandate to migrate every package to ESM, Vitest or another bundler.
6. Run #468's packed consumer verification on each supported track and reconcile release validators/peer normalization before #469 releases. The external peer normalizer currently copies root ranges; it must not erase intentionally verified runtime contracts.

Do not add `nx`, `@nx/*`, `@nestjs/cli`, schematics or `@anarchitects/nest` to a published brick's runtime dependencies merely because the development workspace uses them.

## Repeatable alternate-major development hosts

Run these from the repository root:

```sh
yarn nx run release-tools:test-nest-development-host:nest11
yarn nx run release-tools:test-nest-development-host:nest12
```

The default configuration is `nest12`. Both hosts require the tooling Node range above and an available npm CLI/registry. They use TypeScript 6.0.3 with `NodeNext`, legacy decorator metadata and `skipLibCheck: false`, independently of the root TS config. This is the selected standalone-host compiler setup, not a change to the existing library tsconfigs or a certification of minimum runtime Node versions.

| Dependency                           | Nest 11 fixture | Nest 12 fixture |
| ------------------------------------ | --------------- | --------------- |
| common/core/testing/platform-fastify | 11.1.6          | 12.1.2          |
| Fastify                              | 5.4.0           | 5.12.5          |
| Config                               | 4.0.2           | 12.0.1          |
| JWT                                  | 11.0.1          | 12.0.2          |
| TypeScript / Node types              | 6.0.3 / 22.18.6 | 6.0.3 / 22.18.6 |
| reflect-metadata / RxJS              | 0.1.14 / 7.8.2  | 0.1.14 / 7.8.2  |

`tools/testing/nest-hosts/{11,12}` contains exact manifests and complete npm lockfiles with `.template` suffixes. These are fixture inputs, not discoverable workspace packages. The runner copies one into a fresh OS temporary directory outside the repository, performs `npm ci` with strict peer/engine checks and lifecycle scripts disabled, compiles the decorated host, and executes both CommonJS and ESM entry points. It clears inherited Node module paths/loaders, does not symlink workspace dependencies, and cleans up on success or failure. Each target runs uncached because installation/runtime checks must actually execute.

The probe checks constructor injection using emitted metadata, Config loading, JWT sign/verify, a Fastify request with response schema, shutdown, and shared framework identity across CJS/ESM imports. Requests use Fastify injection and do not open a listening port. Offline fixture tests run as part of `release-tools:test` and existing CI, checking exact framework alignment, manifest/lock consistency, isolation and invalid runner arguments.

To update a fixture, copy its two templates to a disposable directory under the canonical npm filenames, deliberately update direct versions and regenerate the lock there, then copy the reviewed manifest and lock back with their `.template` suffixes. Rerun both host targets and `release-tools:test`. Never resolve a new dependency graph silently during a host test; `npm ci` must fail for lock drift. The root `yarn.lock` is independent.

### Verification boundary and handoff

On 2026-10-09, both host configurations passed on Node **24.21.0**, npm
**11.19.0**, with the committed fixture locks: strict clean installation,
TypeScript compilation, CommonJS execution and ESM execution. The release-tools
suite passed **37 tests**, including the three new offline fixture/argument
checks. This is evidence for that environment, not the full advertised Node
engine range. Minimum-version and CI-matrix coverage belongs to #468.

These hosts contain **no Anarchitects bricks**. Passing them establishes a working upstream/compiler/loading baseline, not Nest 12 brick support, mail delivery, database compatibility, security correctness or a packed-package release gate. There is no forced install or rewritten brick manifest to manufacture a pass.

#464–#467 add their package-level checks and determine per-track compatibility. #468 supplies real packed-artifact consumers, database/mail/HTTP behavior, optional-peer absence, Node minimum coverage and the CI matrix. Use the locked host strategy as the foundation while keeping package-specific dependencies explicit. Existing Newsletter, passkey and persistence examples remain part of that evidence; nonexistent Forms/Auth Nest examples from older README commands must not be counted.

#463 introduces only development tooling and policy. No runtime peer change, package version bump, published API break or npm deprecation is performed here.

## Common Mailer follow-up (#465)

#465 runs before #464 because Auth has a mandatory Common Mailer dependency.
The [Common Mailer compatibility matrix](../../libs/common/nest/mailer/README.md#compatibility-and-migration)
verifies packed consumers on both Nest majors while retaining root Nest 11.
Mailer 2's declarations use a Nest subpath removed in Nest 12. Mailer 3 fixes
that import and requires Nodemailer 8; these dependency changes belong to a new
Common minor, leaving `0.4.x` available for the older Nest 11 stack. The public
Common Mailer API and CommonJS output are preserved.

The root mailer dependencies move to the same stack so normal builds and tests
exercise the supported adapter. Common Mailer's intentional peer ranges are
protected from root normalization. #468 still owns minimum-Node coverage and
the full release/CI matrix; #469 owns versioning and release routing. Downstream
issues must opt into the new Common minor explicitly and verify their own packs.
