# Maintenance branch establishment (#519)

Recorded 2026-11-14 for [#519](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/519), under #500/#499. Current state: branch established with permanent protection and successful live maintenance PR proof. Implementation PRs #527 (main) and #528 (maintenance) await human review/merge. No release, publication or deprecation is authorized by this record.

## Architecture preflight

The 20 local ADRs and all 24 Meta ADRs were enumerated again. Both inventories are unchanged from the complete review recorded in [#500's audit](500-nest11-maintenance.md); Meta remains at `b2cc857bef3ecc4180ca8180db015ba5537bc497`. Relevant release/development/packed-validation, mailer-security, CI and routing guides were revisited, together with accepted Meta 0017/0018. Local 0013–0016 and Meta 0010–0013 require patch-only Nest 11 maintenance, preserved canonical contracts/runtime commitments and Nx version authority. Meta 0015 keeps live Git policy checks uncached. Meta 0016–0019 retain human acceptance, owner release authority and SDLC board status. No obsolete sprint milestone is assigned.

Conflicts resolved explicitly: the older release-plan statement that maintenance has no route is superseded by merged #518; available routing is not activation/publication. Older 0.12/0.11/0.2 proposal tables describe historical candidates, not this branch's Auth 0.13/Forms 0.12/Identity 0.3 lines. Local human-only commit/PR/merge instructions still govern this implementation handoff. No new two-person review rule or runtime migration is introduced.

## Immutable branch-point evidence

| Evidence                                                   | Exact revision                             |
| ---------------------------------------------------------- | ------------------------------------------ |
| Accepted R1 Identity closure                               | `4ca4d0e46f6741fcaf18ff9df38dee099ff65166` |
| Accepted #513 mailer security fix                          | `87c4b3f335ee300c8c4a2f64f8c753a837833141` |
| Published security baseline, including Common Mailer 0.5.1 | `fcf2f27b85f9e43dce988ea67150a5aacce934ac` |
| Accepted #517 ancestry guard                               | `c4456dfdc0a014f3a5268d768cdadcf80ac8f712` |
| Selected #518 routing merge and created branch point       | `e8313e64b17fe98edd9470bd5169067e350d54c8` |
| Selected tree                                              | `e0bb81bc9af8aca2bf344142249da2bedd0cb045` |

Git verifies R1, #513 and the published baseline as ancestors of the selected branch point. Changes after the published baseline are the two reviewed release-tooling PRs. `libs`, root package/lock files, generated OpenAPI and packed-host fixtures have no diff from that baseline. The selected tree equals reviewed #524 head `949b111355e389e2ae04a511154b615169fa2909`; that equality is recorded as provenance, not as a claim that a maintenance-targeted PR has run.

GitHub reports `maint/nest-11` at exactly the selected SHA with `protected: true`. At creation, the live branch rules endpoint reported update, deletion and non-fast-forward restrictions from bootstrap ruleset 27271268. After the successful CI proof below, permanent ruleset 27273187 replaced that lock without moving the branch. Local maintenance-history and all package-line checks pass. CodeQL's Actions and JavaScript/TypeScript checks succeeded on the exact branch-point commit in [run 43622321785](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43622321785). Existing mailer publication and matrix evidence is linked from [#512](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/512); it does not replace #520's new candidate/registry proof.

## Effective administrative state

- [Maintenance ruleset 27273187](https://github.com/anarchitects/anarchitecture-bricks-3tier/rules/27273187): active; matches only `refs/heads/maint/nest-11`; requires `main` and `maintenance` from GitHub Actions integration 15368, CodeQL, squash PRs and linear history, and blocks deletion/force pushes. The only bypass is the existing release bot integration 3090882. The effective API rules match `.github/rulesets/maintenance-active.json`.
- Historical bootstrap lock 27271268: installed before branch creation with no bypass actors. It blocked updates, deletion and force pushes until the permanent rules were installed and verified alongside it. It was then deleted; it is not currently enforced.
- [Immutable package tags 27271275](https://github.com/anarchitects/anarchitecture-bricks-3tier/rules/27271275): active; covers the exact 15 package tag patterns in [.github/rulesets/package-tags.json](../../.github/rulesets/package-tags.json); blocks updates/deletion with no bypass, permits creation.
- [Main ruleset 9157558](https://github.com/anarchitects/anarchitecture-bricks-3tier/rules/9157558): before/after API responses are identical, including status checks, CodeQL, merge settings, bypass actors and update timestamp. There is no classic main branch protection; the ruleset is its effective policy and was preserved.
- CodeQL default setup is configured. GitHub documents scanning for [default and protected branches](https://docs.github.com/en/code-security/concepts/code-scanning/setup-types); the live gate evidence and shared-head analysis limitation are recorded below. Fork-specific CodeQL exclusions must be handled through a same-repository reviewed backport, without weakening required scanning.

The checked-in JSON files are reviewable request bodies. `maintenance-active.json` and `package-tags.json` are applied and verified. `maintenance-bootstrap.json` records the former lock and can prepare a separately reviewed recovery lock; do not assume its deleted ruleset ID can be reused.

## Activation and live PR evidence

Local preparation checks passed on Node 24.22.3: 131 release-tool tests, release-tool lint (four existing host-fixture warnings), documentation validation, formatting and actionlint 1.7.12. The strict ancestry target passed for all 15 package tags at the exact branch point. New Git-fixture tests cover squash-title/commit intent, manual version changes, invalid PR evidence and ancestry; workflow tests cover unfiltered maintenance routing, the complete matrix dependency and ruleset boundaries.

The maintainer explicitly authorized committing, pushing and opening the two implementation PRs, without authorizing merges or publication. Both PRs proved the implementation at `4bafbfb5c7cab1fb3c072598ab630c0b9b30d3d8`:

| Check                                                          | Evidence                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #528 maintenance-base full repository CI                       | [`main`, success](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43625762672/job/132541080508)                                                                                                                                         |
| #528 maintenance policy, complete 11-lane matrix and aggregate | [Run 43625781003, all 13 jobs successful](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43625781003); [`maintenance`, success](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43625781003/job/132542640605) |
| #528 Angular consumers                                         | [Run 43625762609, both lanes successful](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43625762609)                                                                                                                                   |
| #527 main-base full repository CI                              | [`main`, success](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43625759795/job/132541071459)                                                                                                                                         |
| #527 packed and Angular consumers                              | [All 11 Nest lanes](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43625759613); [both Angular lanes](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43625759790), success                                   |
| Shared-head CodeQL gate                                        | [CodeQL gate, success](https://github.com/anarchitects/anarchitecture-bricks-3tier/runs/132541172817); [Actions and JS/TS analysis run](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43625757164), success                           |

The two PRs share a head, so GitHub's run `pull_requests` arrays list both and cannot distinguish the triggering base. Workflow `display_title` matches the distinct PR titles and identifies the main jobs above. CodeQL lists its run as PR #527 and has no separate analysis entry for `refs/pull/528/merge`; we therefore do not claim a separate maintenance analysis. Instead, #528's rollup explicitly reported the successful CodeQL gate, and GitHub reported #528 **CLEAN/MERGEABLE** after the CodeQL-bearing permanent rules became effective and the bootstrap lock was removed. This verifies the actual merge requirement on the maintenance PR.

Correcting #528's companion link triggered an `edited` event and superseded initial run 43625762659. Its cancelled dependencies produced a failing aggregate, while the replacement run above passed. This demonstrates that cancellation does not produce a green aggregate. Static routing tests verify that documentation-only changes cannot skip the unfiltered maintenance workflow. Scope-specific passkey tests were not triggered by this tooling/docs-only diff and remain in place for relevant changes.

Activation was additive: create ruleset **27273187**, verify all its effective rules while lock **27271268** still applied, then delete only **27271268**. Read-after-write queries confirmed the permanent rule set, protected branch SHA `e8313e64b17fe98edd9470bd5169067e350d54c8`, unchanged main and tag rules, and open/mergeable PR #528. No merge was performed. If a future protection change needs recovery, add a new reviewed lock before changing active controls; never relax main or immutable-tag rules.

The final evidence-only documentation commit is separate from the CI-tested implementation above; GitHub must run its normal required checks before merge. Accept and merge the bootstrap changes through #527/#528, then continue #520's exact-candidate release/clean-consumer proof. #519 remains In Review, and #500 continues to gate #501. Neither technical protection nor this successful CI proof authorizes publication.

No live release workflow was dispatched, and no package version, existing Git tag or npm metadata was changed. Branch creation/configuration is distinct from permission to publish. Compatibility impact is limited to stricter backport/CI and tag-mutation controls; no package API break or npm deprecation is proposed.
