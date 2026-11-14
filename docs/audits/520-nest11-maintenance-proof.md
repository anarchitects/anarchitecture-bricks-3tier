# Nest 11 maintenance candidate proof (#520)

Recorded 2026-11-14 for [#520](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/520), under [#500](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/500) and [#499](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/499). This record separates the accepted source candidate, fresh Linux CI, a disposable local versioning rehearsal and publication. No maintenance package has been published by this work.

## Decision preflight and candidate

The 20 local and 24 Meta ADRs reviewed for #519 were enumerated again; their contents were unchanged. Meta remains at `b2cc857bef3ecc4180ca8180db015ba5537bc497`. The #520 scope review revisited local ADR-0011–0017, Meta ADR-0010/0012/0017/0018, the maintenance/routing, packed-release, canonical-conformance and TS-contract guides. Accepted constraints remain: Nest 11 security/bugfix patches only; canonical Contracts ownership and exact pins; preserved Fastify behavior, facade/advanced APIs and runtime support; Nx version authority and domain alignment; owner approval separate from technical readiness. No proposal overrides an accepted decision.

Both #519 PRs were human-merged. The maintenance candidate is **`6de3a4fc1e0d9b961da174605992598a539b73ff`** ([#528](https://github.com/anarchitects/anarchitecture-bricks-3tier/pull/528)); main's corresponding squash was `6abe55d9ffbacb1ec0050fa2247c9799b3d89cea` ([#527](https://github.com/anarchitects/anarchitecture-bricks-3tier/pull/527)). Their trees equal reviewed head `29250f799d12ac163c60ac0eae67248e2cb00497`. The maintenance branch descends from accepted branch point `e8313e64b17fe98edd9470bd5169067e350d54c8`, published baseline `fcf2f27b85f9e43dce988ea67150a5aacce934ac` and R1 `4ca4d0e46f6741fcaf18ff9df38dee099ff65166`.

The [structured evidence](520-nest11-maintenance-proof.json) records all 15 source package versions, canonical artifact hashes, successful matrix jobs, local fixture checks and existing registry metadata. Source package versions are:

| Domain     | Candidate package versions                       |
| ---------- | ------------------------------------------------ |
| Auth       | Angular 0.13.2; Declarations, Nest and TS 0.13.1 |
| Forms      | Angular, Nest and TS 0.12.1                      |
| Identity   | Angular, Nest and TS 0.3.0                       |
| Newsletter | Angular, Nest and TS 0.2.1                       |
| Common     | Mailer 0.5.1; Tailwind 0.0.1                     |

Canonical pins remain Auth `0.1.0`, Forms `0.2.0`, Identity `0.0.1` and Newsletter `0.1.0`. They are contract versions, not the Bricks versions above.

## Fresh exact-candidate CI

[Packed run 43636979644](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43636979644) was manually dispatched on `maint/nest-11` and ran at the exact candidate SHA. All **11 lanes and 83 host executions** passed: 58 Nest 11 and 25 retained Nest 12 compatibility executions.

| Nest | Consumer Node | PostgreSQL | Hosts | Result                                                                                                          |
| ---- | ------------- | ---------- | ----- | --------------------------------------------------------------------------------------------------------------- |
| 11   | 20.19.0       | 16         | 8     | [Passed](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43636979644/job/132575818511) |
| 11   | 22.13.0       | 16         | 10    | [Passed](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43636979644/job/132575818594) |
| 11   | 24.11.0       | 16         | 10    | [Passed](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43636979644/job/132575818692) |
| 11   | 24.11.0       | 17         | 10    | [Passed](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43636979644/job/132575818642) |
| 11   | 24.11.0       | 18         | 10    | [Passed](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43636979644/job/132575818626) |
| 11   | 26.11.1       | 16         | 10    | [Passed](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43636979644/job/132575818647) |
| 12   | 22.13.0       | 16         | 5     | [Passed](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43636979644/job/132575818672) |
| 12   | 24.11.0       | 16         | 5     | [Passed](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43636979644/job/132575818614) |
| 12   | 24.11.0       | 17         | 5     | [Passed](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43636979644/job/132575818314) |
| 12   | 24.11.0       | 18         | 5     | [Passed](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43636979644/job/132575818573) |
| 12   | 26.11.1       | 16         | 5     | [Passed](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43636979644/job/132575818629) |

These use fresh temporary consumers, strict peers/engines, locked registry dependencies, `npm ls --all`, strict NodeNext declarations and CJS/ESM loading. They exercise facade/config/advanced composition, PostgreSQL persistence, real mail behavior, Auth/Declarations and canonical positive/negative HTTP outcomes. The JSON records all 29 operation outcomes from the Nest 11 / Node 24 / PostgreSQL 16 job, including Identity create 200/400, reads 200/404 and update 200/400/404. Build tooling is Node 24.21.0; consumer runtimes are the table's versions.

Retain the [documented exclusions](../guides/nest-release-validation.md): Auth/Declarations are excluded on Node 20; Nest 12 is excluded there; Config 4 is not a Nest 12 combination. Linux lanes do not certify every semver-admitted combination or operating system. The legacy Nodemailer 8 host proves installation compatibility, not security remediation. Ten Auth recovery/passkey HTTP outcomes use labelled adapter-only doubles; separate verifier/persistence coverage does not make these full recovery or WebAuthn ceremonies. Canonical host bindings, Forms D05/D08 access/secret-rotation obligations and deployment security remain separate gates under the [conformance guide](../guides/canonical-conformance.md).

## CI patch rehearsal

The first [Release dry run 43636982673](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43636982673/job/132575826728) passed using main control `6abe55d9ffbacb1ec0050fa2247c9799b3d89cea`, resolving and checking out the exact maintenance candidate. Canonical artifact/HTTP checks and ten Nest 11 hosts passed on Node 24.22.2. Strict ancestry passed for all three selected Identity package tags.

Inputs were `line=maint/nest-11`, `candidate_sha=6de3a4fc1e0d9b961da174605992598a539b73ff`, `domain=identity`, `expected_groups=identity`, `bump=patch`, `first_release=false`, `common_group=all`, **`dry_run=true`**. Identity was selected solely for a focused rehearsal without downstream domain expansion. Nx 23.2.1 proposed:

| Package          | Current | Rehearsal | Internal dependency change       |
| ---------------- | ------- | --------- | -------------------------------- |
| identity-ts      | 0.3.0   | 0.3.1     | Canonical dependency stays 0.0.1 |
| identity-nest    | 0.3.0   | 0.3.1     | identity-ts `^0.3.0` → `^0.3.1`  |
| identity-angular | 0.3.0   | 0.3.1     | identity-ts `^0.3.0` → `^0.3.1`  |

The log labels proposed GitHub releases `[dry-run]`; token creation and “Version and create GitHub releases” were skipped. Publishing was explicitly skipped. The forced patch exercises the release path; the source has no new Identity fix justifying that publication. **0.3.1 is an unpublished rehearsal, not an owner-selected release.**

Main subsequently accepted credential-custody [#529](https://github.com/anarchitects/anarchitecture-bricks-3tier/pull/529), control `736f1b719f9319b0af1c9c4b2a2997cf467673c7`. [Repeat dry run 43638227996](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43638227996) uses that control and the same pinned candidate/inputs. The maintainer approved its required `shared-bot-release` environment. The [release job](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/43638227996/job/132579680036) then passed at 21:40 Europe/Brussels: candidate/canonical gates, ten Nest 11 hosts on Node 24.22.2, the same three-tag ancestry check and the same Identity patch/dependency preview. Token creation and actual version/release steps were skipped. This establishes the current control's dry-run result independently of the earlier run.

The intended annotated tags contain `anarchitecture-release-line: maint/nest-11`; the reviewed publishing resolver maps this to `nest11`, preserving `latest`. Existing release-tool regression tests exercise that actual resolver, including maintenance commits also reachable from main and retry/no-rollback rules. The dry run does not execute `resolvePublishTag` against a real new tag or npm Trusted Publisher. Actual publication/dist-tag preservation remains unverified by this rehearsal. The pinned maintenance candidate predates #529 and contains the older App-key release-event relay. After unguarded keys are removed, use the documented manual `Publish` dispatch from main for an existing owner-authorized tag, or separately review a relay backport before relying on automatic release events. A successful preview does not prove that older relay works.

## Local versioned-fixture proof

Local evidence is **macOS arm64, Node 24.22.3, Yarn 4.18.0, Nx 23.2.1**, separate from Linux CI. An isolated checkout at the candidate ran:

```sh
yarn nx run release-tools:domain-release --domain=identity --line=maint/nest-11 --expected-sha=6de3a4fc1e0d9b961da174605992598a539b73ff --expected-groups=identity --bump=patch --skip-publish --yes --dry-run
```

An observation-only wrapper captured the Identity manifests from Nx's in-memory `FsTree.listChanges()` while returning its results unchanged. The dry run exited successfully; before/after tracked diffs and Git tag references were identical. The preview changed only the versions/internal ranges shown above. No package version was manually chosen in place of Nx's output.

The captured manifests were then materialized only in the disposable checkout. The production `planHostFixtureVersions` function produced exactly four changes: the Forms/Identity candidate map and the Nest 11, Nest 11-modern and Nest 12 lock templates. All unrelated/registry lock entries were compared and remained identical. A second planner invocation returned no changes. The evidence JSON records output hashes.

Both `release-tools:test-forms-identity-nest-compatibility:nest11` and `:nest11-modern` then passed with cache disabled against these versioned manifests/fixtures. Clean installs reported Identity TS/Nest **0.3.1**; strict declarations, CJS/ESM DI identity and explicit/config/override/advanced PostgreSQL, mail and canonical HTTP scenarios passed. This is local proof of the versioned Identity Nest/TS consumers, not CI for a committed release or packed Angular 0.3.1 runtime proof. No versioned manifest/fixture change is included in the review branch. The existing 131 release-tool tests also passed against the current main control, including maintenance routing, registry retry and credential-custody guards; docs content validation passed.

## Publication and acceptance boundary

Read-only npm observations record the existing Identity 0.3.0 versions, registry integrity/shasums, gitHead and `latest=0.3.0`; no `nest11` tag was present. These are existing-artifact metadata, not new publication or fresh registry-installed 0.3.1 consumer proof. No release, tag, push, npm mutation or deprecation was performed by the rehearsal.

#520 explicitly forbids fabricating a patch merely to finish the epic, while #499's broader exit criteria retain actual maintenance publication. Preserve that distinction: an owner-selected real patch must later verify CI versioning, fixture synchronization on the resulting commit, immutable registry artifact integrity, strict registry-installed consumers and unchanged `latest`. Historical #512 publication does not substitute for those maintenance-route checks. #500/#501 remain gated by human acceptance; this record does not silently waive the parent publication criterion.

The evidence and current-control run are ready for human review; #520 remains In Review until accepted. No package API, support range, dependency, canonical contract or runtime behavior changes are proposed. No breaking change or npm deprecation is proposed. Suggested documentation commit: `docs(release-tools): record Nest 11 maintenance candidate proof`.
