# Nest 11 maintenance branch and backports

The branch [`maint/nest-11`](https://github.com/anarchitects/anarchitecture-bricks-3tier/tree/maint/nest-11) was created for [#519](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/519) at accepted routing merge `e8313e64b17fe98edd9470bd5169067e350d54c8`. It is currently **frozen**, including for the release bot, while its CI/bootstrap PR is reviewed. The [evidence record](../audits/519-maintenance-branch.md) distinguishes the effective lock from the prepared steady-state protection. No maintenance release or npm publication is implied.

[#518](https://github.com/anarchitects/anarchitecture-bricks-3tier/pull/524) delivered the main-controlled [release route](maintenance-release-routing.md). [#520](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/520) still owns exact-candidate CI dry runs and clean registry-consumer proof. Keep #501's main runtime migration blocked until the parent [#500](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/500) proof gates are accepted.

## Supported source lines

These are the versions present at the immutable branch point, not newly published maintenance versions. Nx keeps each domain's major/minor aligned and may advance patches independently.

| Domain        | Package versions at branch point                 | Maintenance line                                |
| ------------- | ------------------------------------------------ | ----------------------------------------------- |
| Auth          | Angular 0.13.2; TS, Declarations and Nest 0.13.1 | 0.13.x                                          |
| Forms         | Angular, TS and Nest 0.12.1                      | 0.12.x                                          |
| Identity      | Angular, TS and Nest 0.3.0                       | 0.3.x                                           |
| Newsletter    | Angular, TS and Nest 0.2.1                       | 0.2.x                                           |
| Common Mailer | 0.5.1                                            | 0.5.x                                           |
| Tailwind      | 0.0.1                                            | 0.0.x, subject to existing consumer peer ranges |

Internal dependency ranges must stay within these lines. Preserve existing exact pins, optional peers and accepted framework/Node floors; do not run range normalizers to conceal incompatibility. A Tailwind 0.0.2 preview currently conflicts with Forms' preserved `^0.0.1` peer and needs a separate compatibility review before such a release. This branch does not reconstruct Common 0.3/0.4 or other older package lines.

Existing dual Nest 11/12 package compatibility remains supported and tested. The branch's purpose is security/bugfix patches; it does not accept new Nest features, Nest 12-native provider migrations, contract adoption changes requiring a version-line advance, runtime removals or broader dependency migrations. Keep the workspace on its accepted Nest 11 tooling baseline. Consult the [packed support matrix](nest-release-validation.md), rather than inferring runtime support from the tooling Node version. Auth/Declarations retain their Node 22+ requirement; eligible other families retain their verified Node 20 lane.

The branch includes the accepted [#513 mailer fix](https://github.com/anarchitects/anarchitecture-bricks-3tier/pull/513) and [#512 publication evidence](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/512). Common Mailer 0.5.1 permits the tested Nodemailer 10.2.1 security combination while retaining Nodemailer 8 installation compatibility. An existing host still resolving Nodemailer 8 is not remediated by the branch or by that peer declaration. Host adoption and provider-specific validation remain separate work.

## Backport review

Use a separate PR targeting `maint/nest-11` and the [maintenance PR template](../../.github/PULL_REQUEST_TEMPLATE/maintenance-backport.md). Prefer the accepted upstream fix and retain provenance, for example with a reviewed `cherry-pick -x`; do not merge main wholesale after feature development diverges. For a maintenance-first urgent repair, record the bug/security scope, relevant owner's decision and forward-port plan. This does not create a feature exception.

Review semantic parity, not just a clean cherry-pick. Reproduce the original defect on the maintenance baseline, retain the upstream regression test where portable, and explain differences needed for the older implementation. Check positive and negative paths, public HTTP status/error behavior, auth/policy decisions, provider composition, optional/noop integrations, strict declarations and persistence effects as applicable. Preserve canonical Contracts ownership and Fastify behavior. Scope-specific parity evidence supplements the required CI checks.

Use an eligible `fix`, `docs`, `ci` or other accurate non-feature Conventional Commit title. CI checks both PR title and commit history; renaming a feature as a fix does not make it eligible. PR title edits rerun the maintenance gate because squash merges use that title. Backport PRs leave publishable versions unchanged; the main-controlled release runner owns versioning and reviewed dependent cascades.

## CI and protection

The prepared steady-state rules require `main` and `maintenance` from GitHub Actions (integration 15368), CodeQL, a squash PR and linear history, while forbidding branch deletion and force pushes. They retain main's existing PR-review settings and the same release-bot bypass (integration 3090882); they do not invent a two-person approval rule. Humans review and accept code. The bot bypass is for owner-authorized CI release commits, not independent approval or general backport merging.

`main` runs the existing full repository checks against the actual PR base, including canonical packed HTTP and persistence checks. `maintenance` always reports for maintenance PRs, including documentation-only changes. It requires both policy validation and the complete existing Nest compatibility matrix, preserving the accepted dual-major coverage. Angular consumer checks also include the maintenance target; relevant-path passkey tests retain their existing coverage. A skipped, failed or cancelled prerequisite does not pass the aggregate gate.

Keep the bootstrap lock until a real maintenance-targeted PR has emitted successful `main`, `maintenance` and CodeQL evidence at its exact current candidate. The new workflow can run from that PR's merge checkout before the branch is unlocked. Follow the [activation procedure](../audits/519-maintenance-branch.md#remaining-activation) to install the prepared rules while retaining the lock, verify the effective result, then remove only the bootstrap lock. Do not require nonexistent check names or unlock the branch merely because local tests pass. If platform permissions or CI routing prevent this proof, leave the lock in place and record the blocker.

## Release and rollback authority

A reviewed backport, a protected branch and passing CI establish technical readiness only. The relevant domain/capability owner separately authorizes publication and selects the exact candidate and release scope under Meta ADR-0017. Maintenance releases are stable patches through the workflow on main, using `nest11`; they must never replace main's `latest`.

The independent [package-tag ruleset](https://github.com/anarchitects/anarchitecture-bricks-3tier/rules/27271275) blocks updates and deletion for the 15 existing package-tag patterns, with no bot bypass. It allows new tags. Preserve published tags and versions permanently. If a release is faulty, stop adoption, pin consumers back to a verified compatible artifact/lockfile, assess data/migration rollback separately, and prepare a reviewed corrective patch. Publish retries use the existing immutable tag from main and never repeat versioning. Any dist-tag correction or npm deprecation requires separate explicit owner approval; neither is performed by #519.
