# Nest compatibility release plan

Decision record for [#469](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/469), closing the documentation and release planning work in [epic #461](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/461). Snapshot: 2026-10-10. This is a release proposal for human review, not a publication record or permission to release.

## Verified support and evidence

All six Nest bricks retain Nest 11 and add Nest 12 in the same new-minor artifacts. **No package drops Nest 11.** See the [Nest guide](nest.md#verified-support) for the package/Node matrix, install recipes and bootstrap changes, and [packed validation](nest-release-validation.md) for exact locked hosts and commands. Runtime consumption does not require Nx, Nest CLI or `@anarchitects/nest`.

The seven Linux lanes in [run 38073619350](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/38073619350) passed against `cd24fb2aff630e04b5300a287fddc65cb127e73b`; [PR #479](https://github.com/anarchitects/anarchitecture-bricks-3tier/pull/479) merged them as `5972b2f`. Nest 11 passed on Node 20.19.0 for eligible families, and both Nest majors passed on 22.13.0, 24.11.0 and 26.11.1. Auth/Declarations are excluded from the Node 20 lane; the locked Nest 12 graph also excludes Node 20. This evidence precedes #469's Auth engine correction and Newsletter TS candidate alignment. Require fresh #469 PR CI and release-commit verification; do not treat an earlier green run as verification of later metadata.

Local #469 verification on macOS arm64 passed all eight changed packed hosts on consumer Node 22.13.0 (Auth baseline/modern/Nest 12; Newsletter baseline/modern/Nest 12 and both optional-peer hosts), all-six artifact validation, 76 release-tool tests, 13 guardrail tests, domain/Angular checks, docs lint/content/build/verify and Nx formatting. Both release dry runs also passed. Fresh Linux PR CI remains the handoff gate.

## Package versions and migration

The npm versions below were checked on 2026-10-10. They are the existing published lines, not the new dual-major artifacts. Source `version` fields remain unchanged until CI versioning. The proposed first versions match packed candidate fixtures; a changed release proposal requires updated fixtures and fresh validation.

| Package                            | Published | Proposed | Breaking requirements for this upgrade                                                                                                                                                                                                                                          |
| ---------------------------------- | --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@anarchitects/common-nest-mailer` | 0.4.0     | 0.5.0    | Mailer 3.0.2+, Nodemailer 8.0.5+, Nest 11.1.6+ or 12.1.2+, Config 4.0.2+ or 12.0.1+; retain existing facade, config and transport APIs.                                                                                                                                         |
| `@anarchitects/auth-nest`          | 0.11.0    | 0.12.0   | **Drop Node 20**; engine becomes `^22.13.0 \|\| >=24.11.0` because Kysely 0.29.6 needs Node >=22. Upgrade Auth TS/Declarations to 0.12 and Common Mailer to 0.5 with its mail peers, even for noop. Use matching Nest/integration versions. No facade or layer export removals. |
| `@anarchitects/auth-declarations`  | 0.11.0    | 0.12.0   | Auth TS 0.12 and raised Nest common floor. Decorators, metadata keys and ESM/CJS exports unchanged; explicit `.js` declaration imports fix strict NodeNext resolution.                                                                                                          |
| `@anarchitects/forms-nest`         | 0.10.0    | 0.11.0   | Forms TS 0.11, Common Mailer 0.5 and its mail peers, plus raised framework/config floors. No facade or layer export removals.                                                                                                                                                   |
| `@anarchitects/identity-nest`      | 0.1.0     | 0.2.0    | Identity TS 0.2 and raised framework/config floors. No mailer dependency; no facade or layer export removals.                                                                                                                                                                   |
| `@anarchitects/newsletter-nest`    | 0.0.1     | 0.1.0    | Newsletter TS 0.1.0, raised Nest/Config/Fastify floors; optional Common Mailer moves to 0.5. Native mode needs its mail stack. Public ports and provider composition remain intact.                                                                                             |

The same release advances **all siblings in each domain's major/minor line**: Auth TS/Declarations/Nest/Angular to 0.12.0; Forms TS/Nest/Angular to 0.11.0; Identity TS/Nest/Angular to 0.2.0; Newsletter TS/Nest/Angular to 0.1.0. Common selects only `common-nest`; Tailwind is excluded. TS and Angular version alignment does not itself mean a new public API break: Auth/Forms/Identity TS declaration specifiers are corrected without changing bundle formats, and Newsletter TS has no API change. Validate all sibling builds and their updated dependency ranges, including Newsletter Angular's Forms dependencies.

Use a new pre-1.0 minor for these breaking dependency/runtime floors. **Do not patch the existing published minors with this stack.** The release runner synchronizes major/minor changes across a domain while allowing independent patches. For this coordinated operation use the explicit `major` override (Nx adjusts a pre-1.0 major to the next minor) and inspect the resulting versions instead of assuming conventional-commit inference produces the candidate plan. Keep Nx-compatible commit scopes equal to real project names, for example `auth-nest`, `newsletter-nest`, `release-tools` or `docs-hub`; a breaking change still needs `!`/`BREAKING CHANGE` disclosure.

Migration sequence for hosts:

1. Record the current package/lock versions, database backup and rollback procedure. Hosts retaining the old mail/runtime stack can stay pinned to the existing minor.
2. Move Auth hosts to a verified Node 22+ lane. For Nest 12, use Node 22.13.0, 24.11.0 or the tested 26.11.1 runtime. Match common/core/platform/testing majors; Config 4, JWT 11 and Nest TypeORM 11 are not Nest 12 combinations.
3. Install the new domain minor and aligned TS/declaration packages only after the required registry versions exist. Upgrade mail dependencies together. Do not use forced peers, overrides or `skipLibCheck` to hide incompatibilities.
4. For Fastify, configure the schema error formatter in the Nest guide so validation stays HTTP 400. Newsletter webhook hosts must preserve exact raw bytes with `rawBody: true`. Keep shared mail transport at the app root; use one facade initialization path per domain.
5. Apply pending exported migrations with `synchronize: false`, then test host-specific authorization, persistence, mail and webhook behavior. Auth's earlier Better Auth/TypeORM persistence transition has its own issuer migration and rollback limitations in the [Auth migration guide](auth-migration.md); Nest 12 adoption does not remove those requirements.
6. Verify strict declarations and CJS/ESM loading against the real installed packages. These releases do not require converting CommonJS hosts to ESM or adopting Nx.

## Newsletter #428 and plugin coordination

[#428](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/428) is closed. Newsletter Nest, TS and Angular 0.0.1 already shipped; the [Nest release record](https://github.com/anarchitects/anarchitecture-bricks-3tier/releases/tag/newsletter-nest%400.0.1) is dated 2026-10-07. The old “unreleased / wait for initial epic acceptance” wording is obsolete. Preserve the intent of that gate: release Newsletter 0.1 as a coordinated domain after review and passing checks, rather than publishing implementation fragments. Use `first_release=false` for these already-tagged packages. FitOverForty adoption is downstream work after the complete required set is available; this PR does not migrate that application.

[`@anarchitects/nest@0.0.3`](https://registry.npmjs.org/@anarchitects/nest/0.0.3) is already available on npm. That satisfies plugin availability, but not workspace adoption: its published init validator rejects library peers containing Nest 11, including verified dual-major ranges. The [development strategy](nest-development-strategy.md) records the tested constraint and native CLI adoption prerequisites. Request an upstream fix in `anarchitecture-plugins` before adopting the plugin with these dual-major manifests; do not narrow brick peers to satisfy the generator. No upstream issue or message is created by this plan.

Runtime releases can proceed after their own acceptance and validation without waiting for plugin adoption. Keep the root on Nest 11 and use isolated Nest 12 hosts until the tooling prerequisites are met. The plugin's higher Node/CLI/Nx requirements are development requirements, not runtime brick requirements.

## Release execution and ordering

Human reviewers accept the code, commit, create the PR and merge. After merge, a release owner reviews the final dry-run output and dispatches [Release (Manual)](../../.github/workflows/release.yml) from `main`; versioning, changelog generation, commits, tags and GitHub releases remain CI-owned. No package versions, release tags, dist-tags, publication or deprecation are changed by #469.

Rehearse with the supported runner in **dry-run mode only**:

```sh
yarn nx run release-tools:domain-release -- --domain=common --group=common-nest --bump=major --skip-publish -d
yarn nx run release-tools:domain-release -- --domain=identity --bump=major --skip-publish -d
```

On 2026-10-10, both dry runs completed locally with all selected sibling preflight builds and tag-ancestry checks; their planned versions match the table. These were dry runs with no version, commit, tag or registry writes.

The common selection expands to **common-nest, forms, auth, newsletter** because these dependent groups have complete release-tag history. The `major` override applies to every expanded group. Identity is separate. Do not subsequently dispatch individual Auth, Forms and Newsletter bumps after the common cascade: that would version them twice. Range normalizers mutate manifests: do not run them blindly over the verified exact adapter/internal pins. Any range change requires reviewed source contracts, matching fixture locks and fresh verification. Inspect the final plan and versioned dependency ranges before accepting this route; repeat the dry run on the exact merged commit if new changes or tags arrive.

Dispatch inputs for the accepted plan are `domain=common`, `common_group=common-nest`, `bump=major`, `first_release=false`, then `domain=identity`, `bump=major`, `first_release=false`. Each invocation still selects exactly one domain; the runner handles dependent cascades. Wait for the first workflow and its required publishes before starting another release. Verify tag ancestry from full fetched history; do not manufacture or retarget tags to bypass a failure.

Each GitHub release triggers [Publish](../../.github/workflows/publish.yml) for that existing package tag using npm Trusted Publisher/OIDC. Publish jobs are independent: this is **not atomic registry publication** and trigger order does not guarantee dependency availability. Confirm Common Mailer 0.5 and each domain's TS/Declarations artifacts exist before declaring dependent Nest packages ready; confirm Forms 0.11 before declaring Newsletter Angular 0.1 ready. Inspect every publish result. If a publish fails, resolve the cause and retry `publish.yml` with the same existing tag; do not repeat versioning. Announce the coordinated set only once all required versions install from npm with strict peers/engines.

Before release, require repository CI, the seven packed-host lanes, source/dist/tarball contract checks, TypeORM persistence smoke, domain boundary/tag checks, Angular package checks and docs checks. CI release preflight also builds every selected group sibling. After CI versioning, verify generated versions/ranges and rerun the matrix on the versioned commit; candidate maps must agree with that commit. Verify registry-installed packages after publication. Close #461 only after human acceptance and the required CI/package verification; a green historical run or this plan alone does not close the epic.

## Maintenance branches and deprecation

The subsequent accepted ADR-0013–0016 restrict Nest 11 to security/bug-fix patch maintenance; new Nest features target Nest 12. Portable fixes can be backported in separate reviewed PRs; do not backport raised dependency floors, Node removal or new features as old-line patches. Preserve the recorded release allocations and verified compatibility commitments. Canonical contract adoption precedes separate Nest 12-native modernization under [ADR-0016](../adr/0016-consume-canonical-public-api-contracts.md).

Current operational constraint: `release.yml` explicitly rejects every ref except `refs/heads/main`. A proposed `maint/nest-11` branch does **not** yet have a release route. Before its first maintenance publication, review a dedicated workflow change that allowlists the branch, validates tag ancestry and old-line dependencies, runs that track's tests and assigns explicit npm dist-tags so a maintenance publish cannot replace the new line's `latest`. This routing is a prerequisite, not an implemented capability or a reason to claim Nest 11 is dropped. Existing dual-major compatibility evidence is retained; it does not authorize new Nest 11 features.

The NodeNext declaration fixes in Auth TS/Declarations, Forms TS and Identity TS are candidates for old-line backports. Published versions with the previous declaration layout may warrant deprecation **after a corrected maintenance version exists**; only the affected package/version set should be considered. Deprecation remains a proposal requiring explicit human approval. There is no blanket deprecation of Nest 11 or of every package on the previous minors.
