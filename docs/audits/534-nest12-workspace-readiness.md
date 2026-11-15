# Nest 12 workspace readiness

Audit date: 2026-11-15. Delivery: [#534](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/534), first slice of [#501](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/501), under [#499](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/499).

**The maintenance and upstream implementation prerequisites are accepted, but native plugin adoption is blocked on a consumable artifact containing the upstream fixes.** The npm registry still serves `@anarchitects/nest@0.1.0`; its verified tarball rejects the existing dual-major library peers. This audit changes no dependencies, runtime code, package versions or support claims.

## Architecture preflight

Reviewed all 20 local records at Bricks `2ef62a9872178a9c50fe2ce57010bdc954a39c8e`: `docs/adr/0001`–`0017`, `106`, `121` and `modern-angular-22-signal-forms`. Repository file enumeration and documented references identified no additional local ADR location.

Reviewed all 25 [Meta records at `4f0339d`](https://github.com/anarchitects/anarchitecture-meta/tree/4f0339d86f0ebfa073173ad307cb67c8d6042bdd/adr): numbered 0001–0022, the additional cooperative-governance 0001 and Modern Angular 0008, and `ADR-0001.md`. Cooperative enrichment and 0005–0007 remain proposed. Historical and superseded clauses were read without reinstating them; the proposed amendment in local Newsletter ADR-0010 is not independently accepted here.

Applicable constraints:

- Meta 0008–0012 and local 0011–0016 separate runtime compatibility from tooling adoption. Preserve Fastify validation, serialization, cookies, signed raw bodies and security behavior. Keep domain/application boundaries, TypeORM and public facade/secondary exports. Native AuthN, AuthZ, Mail, Standard Schema and new HTTP adapters remain separate #502–#506 work.
- Meta 0012/local 0016 retain Contracts as public HTTP authority. Existing pins are Auth `0.1.0`, Forms `0.2.0`, Identity `0.0.1`, Newsletter `0.1.0`. No schema or pin changes occur here. Follow the [canonical conformance guide](../guides/canonical-conformance.md) and preserve unresolved host security/profile obligations.
- Meta 0013/local 0017 preserve Nx Conventional Commits, domain major/minor alignment, independent patches and immutable published history. Tooling never becomes a runtime dependency of a brick.
- Meta 0015 requires evidence for graph dependencies, cache inputs, restoration and invalidation; resolved `cache: true` alone is not proof. Fresh external-state, packed installation, database and release gates remain uncached.
- Meta 0016–0019 and repository instructions preserve human acceptance, commit/PR/merge ownership and separate release authorization. Project 15 owns execution; no obsolete Sprint 1/2/3 milestone is assigned, consistent with the [#500 planning record](500-nest11-maintenance.md).
- Meta 0022 makes latest stable the feature target and defines prospective previous-major maintenance. Do not infer EOM from this audit, an upstream release date or the root upgrade. Inventory actual verified successor publications and existing commitments per package before an owner-reviewed EOM statement.

Reviewed the Nest [development strategy](../guides/nest-development-strategy.md), [implementation guide](../guides/nest.md), [historical compatibility audit](../guides/nest-11-12-compatibility-audit.md), [release plan](../guides/nest-compatibility-release-plan.md), [packed validation](../guides/nest-release-validation.md), [maintenance](../guides/nest11-maintenance.md), [release routing](../guides/maintenance-release-routing.md), [TS contracts](../guides/ts-contracts.md), [canonical conformance](../guides/canonical-conformance.md), [CI policy](../ci-strategy.md), [DDD alignment](../guides/alignment-with-bricks-ddd.md) and [migration mapping](../guides/migration-to-bricks-ddd.md). The Modern Angular [guide](../guides/modern-angular/README.md) and [repository application](../guides/modern-angular/repository-application.md) were also reviewed; Angular implementation is outside this slice.

### Conflicts and stale guidance

The current Meta tree accepts amended ADR-0009's native-Node-first validation priority and ADR-0022's lifecycle policy through merged [Meta PR #53](https://github.com/anarchitects/anarchitecture-meta/pull/53) and [Meta PR #54](https://github.com/anarchitects/anarchitecture-meta/pull/54). This #534 change reconciles [local ADR-0012](../adr/0012-platform-neutral-nest-presentation.md) and [local ADR-0011](../adr/0011-verify-nest-runtime-support-independently-of-tooling.md): it removes their stale pending/proposed wording, records accepted upstream evidence and preserves the original decisions as historical context. The lifecycle amendment takes precedence over earlier previous-major feature or broader maintenance permissions; existing commitments require a per-package publication inventory and owner review before EOM dates are set. Neither acceptance changes adapter defaults, peers or release commitments. #506 owns new HTTP adapter evidence; production support and generator-default activation remain separately gated.

The October strategy's plugin `0.0.3` observation is historical. The current `0.1.0` artifact has the same relevant rejection, despite #585's subsequent source fixes. Older guides also describe maintenance creation or #520 acceptance as future work; the accepted #500 completion below supersedes that status. Preserve their dated technical evidence rather than describing it as fresh migration proof.

Project 15 still exposes `Todo`, while Meta defines `Ready`. Use existing shared status values for this work; project schema migration is separate. DDD capability alignment remains relevant, but #499 explicitly makes DDD modernization on demand rather than a mandatory R2 parity gate.

## Accepted prerequisites and remaining gates

| Dependency            | Evidence on 2026-11-15                                                                                                                                                                             | Meaning for #501                                                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bricks #500           | Closed after human acceptance; [PR #530](https://github.com/anarchitects/anarchitecture-bricks-3tier/pull/530) merged at `8acea4626ea101e60da09203798cf135527af179`; children #517–#520 closed     | Maintenance foundation gate satisfied.                                                                                                                        |
| Maintenance candidate | `6de3a4fc1e0d9b961da174605992598a539b73ff`; [accepted proof](520-nest11-maintenance-proof.md) records 11 Linux lanes / 83 hosts, approved patch dry run and separate local versioned-fixture proof | Prior exact-candidate evidence, not a new run here. No maintenance package publication is claimed; #499 retains its eventual authorized real-patch criterion. |
| Plugins #585          | Closed; children #593–#597 completed; final [PR #603](https://github.com/anarchitects/anarchitecture-plugins/pull/603) merged at `6842d8f7bf62e19074bc560e44d49beba0559d75`                        | Source implementation accepted. Publication is a separate gate.                                                                                               |
| Published plugin      | Registry has only `latest: 0.1.0`, published 2026-10-25, before #585's November merges                                                                                                             | Does not contain the required peer-validation fix. Blocks supported adoption in #535.                                                                         |
| Plugins #558          | [Epic remains open](https://github.com/anarchitects/anarchitecture-plugins/issues/558); published `generators.json` has no `migrate-to-native`                                                     | Existing application conversion remains separately gated in #536; it is not the framework upgrade.                                                            |

The [merged plugin guidance](https://github.com/anarchitects/anarchitecture-plugins/blob/6842d8f7bf62e19074bc560e44d49beba0559d75/packages/nest/README.md#existing-publishable-libraries) explicitly retains existing publishable builds and distinguishes installed Nest 12 hosts from broader library peers. Do not treat that source README as documentation of npm 0.1.0 behavior.

## Published plugin probe

Downloaded the tarball identified by [the versioned registry manifest](https://registry.npmjs.org/@anarchitects/nest/0.1.0), and verified its SHA-512 against `dist.integrity`:

```text
sha512-VmOkGvGL6az5Eo5Buyjz9UfjOfZ+7+NkH3EcTn9T5UpbbkIpKKP44ZosypQNJECm/OGwdiW7BXXG29YeEEcS/Q==
```

Registry `gitHead`: `db899b7fd5c868d53901fcfe089bb50c4e339091`. Publication timestamp: `2026-10-25T09:31:37.362Z`. Full registry inventory contained `0.0.0-stage`, `0.0.1`, `0.0.2`, `0.0.3` and `0.1.0`, with no later release or alternate dist-tag.

Executed the unmodified tarball's `dist/utils/validate-dependencies.js` export, `validateNestDependencies`, on macOS arm64 / Node 24.22.3. The test root declared common/core `12.5.0` and CLI `12.0.13`; the nested library varied only its common peer:

| Library peer           | Observed result |
| ---------------------- | --------------- |
| `^12.1.2`              | Accepted        |
| `^11.1.6 \|\| ^12.1.2` | Rejected        |
| `^11.1.6`              | Rejected        |

The dual-major diagnostic was:

```text
libs/example/package.json (peerDependencies): @nestjs/common@^11.1.6 || ^12.1.2 is not a stable Nest v12 range. Use a semver version/range fully within ">=12.0.0 <13"; upgrade older Nest packages together and replace prereleases, tags, or unresolved protocols before retrying.
```

The published init generator visits all nonignored package manifests and passes them to this validator before updating Nx configuration. Thus a root Nest 12 upgrade alone cannot fix this rejection. All six current Nest-dependent libraries declare the tested dual-major common peer.

This was a focused validator probe, loading its `semver` dependency from the existing workspace. It was **not** a clean plugin install, an installed Nest 12 host, an init dry run or packed Bricks runtime proof. No generator was run against this repository.

To reproduce, fetch that exact registry manifest and tarball, verify the integrity, inspect `generators.json` and the init generator, then invoke the exported validator with the two manifest objects and three ranges above. Recheck the full version/dist-tag inventory when unblocking adoption. Use a separately approved published release or explicitly reviewed immutable artifact with provenance and clean consumer evidence; do not patch `node_modules`, hide manifests, narrow peers or assume an unpublished package version. No upstream publication is triggered here.

## Workspace and version inventory

Read-only discovery used the existing install at the Bricks revision above: Node 24.22.3, Yarn 4.18.0, Nx 23.2.1, TypeScript 6.0.3. This is not a fresh immutable-install result. The resolved graph contains 30 projects, six Nest-dependent publishable packages and one registered Nest example, `newsletter-nest-example`. There is no tracked `nest-cli.json` and neither Nest inference plugin is registered.

| Component                                    | Installed workspace | Stable registry candidate inspected on 2026-11-15                                                                                            |
| -------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Common/core/testing/Fastify/Express adapters | 11.1.6              | [12.5.0](https://github.com/nestjs/nest/releases/tag/v12.5.0), same major throughout each host                                               |
| Config                                       | 4.0.2               | [12.1.1](https://registry.npmjs.org/@nestjs/config/12.1.1), common peer admits Nest 11/12                                                    |
| JWT                                          | 11.0.1              | [12.0.5](https://registry.npmjs.org/@nestjs/jwt/12.0.5), common peer admits Nest 8–12                                                        |
| Nest TypeORM bridge                          | 11.0.3              | [12.0.3](https://registry.npmjs.org/@nestjs/typeorm/12.0.3), Nest 10–12 and TypeORM `^0.3.0 \|\| ^1.0.0-dev` peers                           |
| Nest Passport                                | 11.0.5              | [12.0.2](https://registry.npmjs.org/@nestjs/passport/12.0.2), common peer admits Nest 11/12; inventory actual usage before changing/removing |
| Nest CLI                                     | No root declaration | [12.0.13](https://registry.npmjs.org/@nestjs/cli/12.0.13); builder-specific optional peers need review                                       |
| Nest schematics                              | 11.0.9              | [12.0.13](https://registry.npmjs.org/@nestjs/schematics/12.0.13), TypeScript >=6 and Node `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0`             |
| Nx Nest integration                          | `@nx/nest` 23.2.1   | `@anarchitects/nest` 0.1.0 is published but unsuitable for this adoption; its Nx/devkit peers are `>=23.2.0 <25`                             |

These exact upstream candidates are available, **not validated together in Bricks**. The existing packed Nest 12 fixtures use 12.1.2; their success cannot certify 12.5.0. Keep TypeORM 1.1.1, existing mail security dependencies and canonical contract pins unless a specific reviewed incompatibility requires a change. The tooling Node minimum must not silently become a brick's runtime minimum.

The [official migration guide](https://docs.nestjs.com/migration-guide) calls out ESM packages, test/compiler conventions and lifecycle behavior. #535 must verify actual installed exports, decorator metadata, Jest/module loading and integration APIs against the chosen exact versions. It must preserve existing CJS consumption and avoid incidental test-runner, bundler or Angular migrations.

## Build, package and graph ownership

The following comes from resolved Nx configuration, not only `project.json`. Versions below are source manifests, not fresh registry verification of each Bricks package.

| Nx project           | Source version | Build ownership / artifact contract                                                                                           |
| -------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `common-nest-mailer` | 0.5.1          | `@nx/js:tsc`; CommonJS root facade/types; `dist/libs/common/nest/mailer`                                                      |
| `auth-nest`          | 0.13.1         | `@nx/js:tsc`; CommonJS, five additional layer entry points; `dist/libs/auth/nest`                                             |
| `auth-declarations`  | 0.13.1         | Vite via inferred `nx:run-commands`; ESM/CJS and declarations; `dist/libs/auth/declarations`                                  |
| `forms-nest`         | 0.12.1         | `@nx/js:tsc`; CommonJS, five additional layer entry points; `dist/libs/forms/nest`                                            |
| `identity-nest`      | 0.3.0          | `@nx/js:tsc`; CommonJS, five additional entry points including infrastructure compatibility export; `dist/libs/identity/nest` |
| `newsletter-nest`    | 0.2.1          | `@nx/js:tsc`; CommonJS, six additional layer entry points including native adapter; `dist/libs/newsletter/nest`               |

All six publishing targets remain `@nx/js:release-publish` over those output directories. Builds are cacheable with `production`/`^production` and `^build` prerequisites; Vite also declares its external dependency. Jest owns the five implementation libraries' unit tests; Auth Declarations uses Vitest. Domain release groups, package metadata checks and secondary export generation must survive plugin initialization unchanged.

`@nx/nest` appears as a root development dependency and the `@nx/nest:library` defaults in `nx.json`; it owns no resolved build executor. Removing it without handling defaults leaves stale configuration. The native plugin's source-only library generator is not a substitute for these precompiled package contracts.

The Newsletter example uses inferred `webpack-cli build`, explicit `@nx/js:node` serve, and `NxAppWebpackPlugin` with TypeScript compilation, assets, source maps, package-manifest generation and a specific output directory. Prune-lockfile/copy-workspace-modules targets depend on that build. Preserve or explicitly replace this complete behavior in #536; merely adding `nest-cli.json` cannot establish parity. Its contract target also builds the Angular example. No `forms-nest-example` or `auth-nest-example` exists in the graph.

The workspace retains separate packed host, passkey, persistence, canonical HTTP and artifact checks. Packed compatibility and HTTP targets are explicitly uncached. #537 must compare graph edges/target precedence before and after adoption, execute cold/warm builds, restore deleted outputs and prove invalidation from source/dependency/config changes. Remote reuse and distributed CI evidence are separate from local results. Existing docs-cache limitations in the CI guide are not fixed or certified by this audit.

## Ordered delivery and unblock criteria

| Issue                                                                          | Scope                                                                                                           | Handoff                                                                                                                     |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [#534](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/534) | Readiness audit, reproducible published-plugin rejection and local ADR-0011/0012 reconciliation                 | Human review before the next implementation slice                                                                           |
| [#535](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/535) | Root framework/companion dependencies, immutable Yarn lock, supported plugin init and generator-default cleanup | Blocked on accepted audit and a reviewed consumable artifact containing #585; preserve package builds and runtime contracts |
| [#536](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/536) | Newsletter example native CLI migration                                                                         | Blocked on accepted #535 and applicable #558 tooling/evidence; unsupported custom build shapes require explicit resolution  |
| [#537](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/537) | Exact-candidate packed/runtime/conformance/cache/CI proof and migration documentation                           | Queued; requires accepted implementation slices                                                                             |

Each child has one separate human-created PR. Keep the parent program In Progress; the workspace epic is Blocked at handoff while the audit awaits review and the plugin adoption dependency remains unresolved. Preserve Priority and existing Milestone values. Release approval is not requested as part of starting this work.

## Verification and release impact

Read-only project discovery and graph inspection passed; published tarball integrity and the three validator outcomes above were verified locally. Repository Nx discovery required execution outside the restricted sandbox because its worker Unix sockets were denied; no sandbox configuration was changed.

Local documentation checks passed with cache bypassed: `NX_DAEMON=false NX_NO_CLOUD=true yarn nx run-many -p docs-hub -t validate-content,build,verify --parallel=1 --skipNxCache` (including `sync-packages`). Changed-file Prettier formatting, relative audit links and `git diff --check` also passed. These docs targets validate the existing hub; they do not provide a full semantic review of this audit. This slice provides no new Linux CI, clean Nest 12 install, application runtime or cache-restoration evidence. Retain the accepted maintenance proof without relabeling it as evidence for the new candidates.

No breaking package change or npm deprecation is introduced or proposed by #534. A future root tooling upgrade changes development prerequisites; any dropped runtime/peer/export commitment requires explicit breaking-change disclosure, appropriate domain-aligned versioning, migration evidence and owner-approved release. No commit, PR, tag, publication or deprecation is performed by this audit.
