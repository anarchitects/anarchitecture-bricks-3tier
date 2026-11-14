# Nest 11 maintenance preparation

Review date: 2026-11-11. Epic [#500](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/500), under [#499](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/499). This record starts maintenance preparation; it does not establish a working maintenance release route or authorize publication.

## Architecture preflight

All 20 local records in `docs/adr` were reviewed: 0001–0017, 106, 121 and `modern-angular-22-signal-forms`. Repository enumeration and documented references identified no additional local ADR location. The accepted Newsletter record retains its proposed native amendment status. Historical/superseded clauses were read without reinstating them.

All 24 [Meta ADR records at `b2cc857`](https://github.com/anarchitects/anarchitecture-meta/tree/b2cc857bef3ecc4180ca8180db015ba5537bc497/adr) were reviewed: 0001–0021, the additional cooperative-governance 0001 and Modern Angular 0008, and `ADR-0001.md`. Cooperative enrichment and governance 0005–0007 remain proposals. Accepted decisions govern this work; Native Node is an accepted evaluation decision, not an adopted default.

Relevant constraints:

- Meta 0010–0012 and local 0011–0016: Nest 11 receives security/bugfix patches only. Preserve canonical Contracts ownership, Fastify behavior, existing runtime commitments and packed-consumer gates. This work changes no HTTP schema, adapter, runtime dependency or Angular implementation.
- Meta 0013 and local 0017: Conventional Commits remain the version authority; preserve domain major/minor alignment and independent patches. A zero-major feature producing a patch number does not make the feature eligible for Nest 11 maintenance. Published history is immutable.
- Meta 0015: Git ancestry validation depends on live refs/history and must remain uncached. Its offline tests use isolated Git fixtures and do not publish anything.
- Meta 0016–0019 and local agent instructions: human acceptance, commits, PRs and merges remain human-owned. Technical readiness does not authorize a release. Repository Project 15 tracks execution. Legacy Sprint 1/2/3 milestones are obsolete under the SDLC, as confirmed by the maintainer during this work; new children have no milestone.

Engineering references reviewed: [development strategy](../guides/nest-development-strategy.md), [release plan](../guides/nest-compatibility-release-plan.md), [packed release validation](../guides/nest-release-validation.md), [CI strategy](../ci-strategy.md), contributor release rules, and the Modern Angular [guide](../guides/modern-angular/README.md) and [repository application](../guides/modern-angular/repository-application.md). Angular topic-specific implementation guidance is outside this tooling change.

Conflicts resolved or retained explicitly: local ADR-0011's former feature permission is superseded by patch-only policy. The ancestry tool and contributor guidance formerly advised moving tags after squash merges; #517 removes that advice in favor of immutable published history. Project 15 still exposes `Todo` while the SDLC defines `Ready`; this work uses shared `In Progress`, `In Review` and `Backlog` values and does not migrate the project schema.

## Baseline evidence

[R1 #485](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/485) is closed as completed. Its closure records the Identity 0.3.0 domain release at `4ca4d0e46f6741fcaf18ff9df38dee099ff65166`, following reviewed canonical adoption and conformance work.

The implementation branch starts from fetched `main` at `fcf2f27b85f9e43dce988ea67150a5aacce934ac`. Git confirms that the R1 release revision is its ancestor. This later release commit includes the accepted mailer security fix from #513. These are branch-history facts, not fresh packed-consumer or registry-install evidence. #519 must select and verify the exact maintenance branch point before activation.

## Ordered delivery

| Issue                                                                          | Independent review scope                                                                                                                                                            |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#517](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/517) | Harden selected-project ancestry checks, add strict existing-tag mode and preserve immutable-tag guidance.                                                                          |
| [#518](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/518) | Main-only manual entry point, allowlisted maintenance checkout, patch-only planning, dependency lines, tag validation, explicit maintenance npm dist-tag and safe dry runs/retries. |
| [#519](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/519) | Establish the verified maintenance branch, effective protection, required CI and reviewed backport policy after routing is accepted.                                                |
| [#520](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/520) | Exact-candidate clean Nest 11 consumers, canonical positive/negative HTTP evidence, CI dry run and separately authorized release proof.                                             |

Each implementation issue requires its own reviewed PR. #500 remains incomplete and continues to gate #501 until the maintenance outcome is accepted. Branch protection, trusted publishing, the maintenance dist-tag and patch-only planning are follow-up work, not capabilities delivered by #517.

## Ancestry guard behavior and verification

The existing target rejects malformed/unknown CLI selections, unknown or non-publishable projects, shallow or unreadable Git history, existing non-commit/broken tags and tags outside the checked-out history. It reports missing tags separately and preserves the first-release runner's authorization responsibility. `--require-tags` rejects missing baseline tags; it does not fetch tags or prove registry availability.

```sh
yarn nx run release-tools:check-release-tag-ancestry -- --require-tags
yarn nx run release-tools:check-release-tag-ancestry -- --projects=forms-ts,forms-nest,forms-angular --require-tags
yarn nx run-many -p release-tools -t test,lint --parallel=2
```

Local validation on macOS with Node 24.22.2: release-tools tests and lint pass, including 11 new tests for real lightweight/annotated tags, divergent maintenance history, project scoping, absent/corrupt/non-commit tags, invalid arguments and unavailable/shallow history. The strict guard passes for all 15 current package tags against fetched `fcf2f27b85f9e43dce988ea67150a5aacce934ac`. Tests use disposable repositories; published tags and workspace history are not changed. Fresh PR CI and maintenance packed-host/release proof remain separate gates.

Release impact: stricter tooling now rejects previously silent invalid inputs and shallow histories. There is no published package API/runtime break, version change or npm deprecation proposal in #517.

## #518 routing implementation

Preflight refreshed on 2026-11-14 after #517 merged as `c4456dfdc0a014f3a5268d768cdadcf80ac8f712`. Both ADR inventories and the Meta tree above are unchanged. The applicable decisions and conflicts recorded above continue to apply; the release, packed-validation and development-strategy guides were revisited. The implementation preserves canonical gates, Nx Conventional Commit planning and human release ownership. It introduces no library or public HTTP change.

The [routing guide](../guides/maintenance-release-routing.md) records the immutable control/candidate boundary, patch-only guards, reviewed cascade inputs, annotated tag markers, main-based publish relay and registry retry behavior. The baseline is a version-line floor; branch creation/protection and activation remain #519/#520 work. The `nest11` tag is implemented as the explicit maintenance route, without changing npm metadata during this work.

Local validation on macOS with Node 24.22.3: all 121 release-tool tests pass, including real Git fixtures for line/ref/tag validation, intent checks, dependency boundaries, proposed-tag collisions and retry behavior. Release-tool lint passes with four pre-existing warnings in `host-fixture-versions.mjs`. Documentation content validation, formatting and actionlint 1.7.12 pass.

The actual Nx runner completed an Identity patch preview on the working branch and a maintenance preview against `c4456dfdc0a014f3a5268d768cdadcf80ac8f712` in a disposable clone. The latter used a simulated remote-tracking ref only. Tracked files, index and Git refs remained unchanged, and transient plans were removed. A Tailwind patch preview correctly stopped on the existing preserved Forms peer range (`^0.0.1` does not permit `0.0.2`), also without tracked changes or ref mutation. That dependency policy was preserved.

These local simulations do not establish the real maintenance branch, effective GitHub protection, OIDC permission or CI release readiness. No commit, tag, remote branch, GitHub release, npm package or dist-tag was created by the validation. Tooling behavior changes include required `--skip-publish`, exact candidate/cascade inputs for live releases, and rejection of new unmarked tags. There is no published package API/runtime break or npm deprecation proposal.
