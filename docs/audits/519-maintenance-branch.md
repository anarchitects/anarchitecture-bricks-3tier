# Maintenance branch establishment (#519)

Recorded 2026-11-14 for [#519](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/519), under #500/#499. Current state: branch established and update-locked; maintenance CI changes and steady-state rules prepared for review. Required-check activation remains pending the maintenance-targeted PR proof below. No release, publication or deprecation is authorized by this record.

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

GitHub reports `maint/nest-11` at exactly the selected SHA with `protected: true`. The live branch rules endpoint reports update, deletion and non-fast-forward restrictions from bootstrap ruleset 27271268. Local maintenance-history and all package-line checks pass. CodeQL's Actions and JavaScript/TypeScript checks succeeded on the exact branch-point commit in [run 43622321785](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43622321785). Existing mailer publication and matrix evidence is linked from [#512](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/512); it does not replace #520's new candidate/registry proof.

## Effective administrative state

- [Bootstrap lock 27271268](https://github.com/anarchitects/anarchitecture-bricks-3tier/rules/27271268): active; matches only `refs/heads/maint/nest-11`; no bypass actors. Blocks updates, deletion and force pushes, including release-bot updates. Installed before branch creation.
- [Immutable package tags 27271275](https://github.com/anarchitects/anarchitecture-bricks-3tier/rules/27271275): active; covers the exact 15 package tag patterns in [.github/rulesets/package-tags.json](../../.github/rulesets/package-tags.json); blocks updates/deletion with no bypass, permits creation.
- [Main ruleset 9157558](https://github.com/anarchitects/anarchitecture-bricks-3tier/rules/9157558): before/after API responses are identical, including status checks, CodeQL, merge settings, bypass actors and update timestamp. There is no classic main branch protection; the ruleset is its effective policy and was preserved.
- CodeQL default setup is configured. GitHub documents scanning for [default and protected branches](https://docs.github.com/en/code-security/concepts/code-scanning/setup-types); exact maintenance PR evidence still must be recorded. Fork-specific CodeQL exclusions must be handled through a same-repository reviewed backport, without weakening required scanning.

The checked-in JSON files are reviewable request bodies. Only `maintenance-bootstrap.json` and `package-tags.json` are applied. `maintenance-active.json` is **not applied** and must not be confused with live enforcement.

## Remaining activation

Local preparation checks pass on Node 24.22.3: 131 release-tool tests, release-tool lint (four existing host-fixture warnings), documentation validation, formatting and actionlint 1.7.12. The strict ancestry target passes for all 15 package tags at the exact branch point. New Git-fixture tests cover squash-title/commit intent, manual version changes, invalid PR evidence and ancestry; workflow tests cover unfiltered maintenance routing, the complete matrix dependency and the ruleset boundaries. These are preparation results, not successful live maintenance PR checks.

1. Review, commit and open the implementation PR under local human-in-the-loop rules. Ensure the CI/policy changes reach both main and maintenance through reviewed PRs; no bulk merge of future main feature work into maintenance.
2. Open the maintenance bootstrap/backport PR while the update lock remains. Record the PR URL, exact head and merge SHAs, successful `main` and `maintenance` check runs, all packed matrix lanes, Angular consumer results, relevant passkey tests and CodeQL results. Include a documentation-only routing case or demonstrate that the unfiltered maintenance workflow emits its required gate for that case. Local workflow tests are supporting evidence, not this live proof.
3. Re-read main ruleset 9157558 and reconcile any changes made since this snapshot before using the prepared active payload. Preserve its current controls. Only after step 2, create the active maintenance ruleset using `.github/rulesets/maintenance-active.json` while the bootstrap lock still applies. Record its returned ID and verify effective `main`/`maintenance` checks are attributed to GitHub Actions, plus PR, CodeQL, linear-history, deletion and non-fast-forward rules and the intended bot bypass.
4. Once the additive active rules are verified, remove only bootstrap ruleset **27271268**. Re-read effective branch rules, verify the exact branch SHA and confirm main/tag rules remain unchanged. If activation fails, retain or restore the lock; never temporarily relax the existing main or tag rules. A human reviews and merges the maintenance PR under the active controls.
5. Update this evidence record with the actual PR/check links and activation result. Keep #519 open until its acceptance is confirmed. #520 and explicit owner release approval still precede publication; #500 still gates #501.

No live release workflow was dispatched, and no package version, existing Git tag or npm metadata was changed. Branch creation/configuration is distinct from permission to publish. Compatibility impact is limited to stricter backport/CI and tag-mutation controls; no package API break or npm deprecation is proposed.
