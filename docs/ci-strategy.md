# CI and Nx execution policy

Audit baseline: `63630aa` on 5 October 2026 (Nx 23.2.1, Yarn 4.18.0).

GitHub Actions owns merge checks, credentials, Docker/browser integration environments, artifacts, deployment and release. Nx decides affected projects and orders task dependencies. Nx Cloud accelerates repeatable source-based work through remote caching and agents. Local hooks provide optional early feedback; they never replace authoritative CI checks.

## Check placement

| Check                                                      | GitHub CI                                                                    | Nx Cloud                                                                    | Local feedback                                                     |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Immutable dependency install                               | Every job that needs dependencies; cache Yarn downloads                      | Agent installation is separate from task-result caching                     | Install when dependencies change                                   |
| Domain tags, domain boundaries, Angular package metadata   | Every PR, before agents start                                                | Disabled; cheap repository-wide checks                                      | Optional pre-push                                                  |
| Non-bumping commit policy                                  | Every PR, against Git history and the PR base                                | Disabled; history is not a source-file cache key                            | Optional pre-push; a commit-message hook cannot check the whole PR |
| Guardrail and release-tool tests                           | Every PR, before agents start                                                | Disabled; small checks that inspect repository policy                       | Optional targeted run                                              |
| Documentation completeness                                 | Every PR                                                                     | Disabled in PR preflight; local Nx cache remains available                  | Optional pre-push                                                  |
| Formatting validation                                      | Every PR                                                                     | Disabled; do not upload formatting logs through `nx-cloud record`           | Format staged files in an optional pre-commit hook                 |
| Affected lint                                              | Every PR                                                                     | Remote cache and agents                                                     | Editor or optional pre-push                                        |
| Affected unit tests                                        | Every PR; tooling tests are excluded here because preflight already ran them | Remote cache and agents                                                     | Optional affected pre-push                                         |
| Affected builds                                            | Every PR                                                                     | Remote cache and agents; retain memory-conscious concurrency                | Optional targeted builds                                           |
| Browser `e2e-ci`                                           | Main-targeted PRs                                                            | Remote cache and agents, using inferred Playwright tasks                    | Optional explicit run                                              |
| OpenAPI generation/lint and Compodoc                       | PR previews; also Pages generation                                           | Remote cache on GitHub runner, distribution disabled for this orchestration | Explicit docs command                                              |
| TypeORM packed-manifest validation                         | Every PR, including prerequisite builds                                      | Disabled for this invocation                                                | Explicit package check                                             |
| PostgreSQL persistence and published-adapter smoke tests   | Every PR for persistence; affected for adapter                               | Disabled, and both smoke targets have `cache: false`                        | Explicit Docker-backed run                                         |
| Angular 21/22 packaged-consumer matrix                     | Every main-targeted PR and manual dispatch                                   | Disabled; fresh registry installation and build                             | Explicit compatibility run                                         |
| Passkey browser contracts                                  | Existing relevant-path PR workflow and manual dispatch                       | Already disabled; retain real browser/host execution                        | Explicit browser run                                               |
| Docs Pages deployment                                      | Relevant main pushes and manual dispatch                                     | Source generation may cache; upload/deploy remain GitHub actions            | Preview only                                                       |
| Versioning, tag ancestry, commit/tag/push, GitHub releases | Manual release workflow                                                      | Disabled throughout release                                                 | Never a routine hook                                               |
| npm trusted publishing, provenance, registry checks        | Release event or manual retry for an existing tag                            | Disabled throughout publish; retain fresh build/test                        | Never a hook                                                       |
| CodeQL                                                     | GitHub-managed code scanning                                                 | Outside Nx Cloud                                                            | Optional editor feedback                                           |
| Self-healing suggestions                                   | Retained after cloud tasks, only when agent startup succeeded                | Existing Nx Cloud service; no new auto-apply setting                        | Human review of proposed fixes                                     |

## Findings addressed

- Feature CI used Node 20 and an older SHA action while main CI used Node 22. Both PR workflows now use Node 22 and `nx-set-shas@v5`, explicitly referencing the actual PR base branch (including `feat/**`).
- Feature CI waited for `contract-test` even though that command was commented out. Stop conditions now name the actual distributed target families, with an always-run completion step for failed or empty runs.
- Quick checks and history-dependent policy were sent to agents. They now run before cloud startup with `NX_NO_CLOUD=true` and distribution disabled. Release-tool tests also run unconditionally; the distributed test invocation excludes both tooling projects to avoid duplicate execution.
- Startup used `yarn dlx nx`, resolving an independent CLI version. It now uses the installed, lockfile-controlled Nx CLI after installation and preflight.
- Setting `NX_CLOUD_DISTRIBUTED_EXECUTION=false` alone did not isolate database tests from Cloud. The sampled persistence step restored all nine tasks from cache, including the smoke test. Both Docker smoke targets are now uncached, and their workflow step disables Cloud entirely. Prerequisite builds can still reuse local results already present on the runner.
- Packaged-consumer, release and publish workflows now explicitly disable Cloud. Existing publish freshness flags and OIDC trusted publishing remain in place.
- `sharedGlobals` pointed to the nonexistent `.github/workflows/ci.yml`. It now tracks Yarn configuration and Node version; Angular test inputs also track their root runner config and shared setup file. Exact Node versions intentionally partition cached results between different runtimes. Align runner and agent versions before expecting cross-runtime cache hits.
- Tailwind's deterministic build and tests were uncached; the sampled build ran on three agents. Build, test and typecheck now declare caching with project and dependency inputs; build output was already declared.
- New commits cancel older PR runs. Job timeouts bound execution. Fork PRs skip Nx Cloud startup and self-healing, run the same checks on GitHub, and install Chromium for main-PR E2E.
- The required check context remains `main`. No branch rules, release triggers or release permissions were changed.

## Evidence and tradeoffs

The [sampled main PR job](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/37308030427) ran from 12:13:23 to 12:19:02 UTC (5m39s). Dependency installation took about 56 seconds. Several tiny agent-dispatched checks each took about 13 seconds; the initial commit-policy step took 30 seconds. These timings include scheduling overhead and are not pure test runtimes.

The same PR's packaged-consumer jobs took roughly 84 and 140 seconds, and the passkey contract job roughly 127 seconds, concurrently with the main job. Keeping these checks is justified: package installation against other Angular versions and browser passkey behavior cover different failure modes from unit tests. Moving them to developer-only hooks would remove shared evidence.

Uncached database execution deliberately trades cache hits for a fresh integration result. This change does not promise a net wall-clock reduction. Compare several similar PRs after rollout, recording critical-path duration, agent minutes, cache hits and database runtime. Keep the existing 3/3/5-agent distribution sizing until those measurements justify changing it; local task timings cannot establish an optimal fleet size.

The repository ruleset currently requires `main` and CodeQL. Separate consumer/passkey checks are not listed as required status checks. Consider making the consumer matrix required and adding an always-emitted gate for path-filtered passkey checks before requiring that workflow; skipped path-filtered workflows must not leave PRs permanently waiting. Changing the ruleset is an administrative follow-up, not part of this PR.

## Optional local hooks

No hooks are installed automatically and no new hook dependency is introduced. Teams may opt in using their existing hook manager.

- Pre-commit: format only staged files, with a tool that safely preserves partially staged changes. Keep automatic fixes local; CI should validate rather than rewrite a commit.
- Pre-push: use `NX_NO_CLOUD=true NX_CLOUD_DISTRIBUTED_EXECUTION=false yarn nx affected -t lint,test --base=origin/main --parallel=1`. Fetch the intended base first, and use `origin/feat/<name>` when targeting a feature branch. A plain `--base` includes working-tree changes; add `--head=HEAD` to validate only committed changes.
- Optionally add the repository policy commands from the preflight step. Set `NX_BASE` to the intended base for commit-policy validation.
- Keep Docker smoke tests, the full consumer matrix, browser suites, deployment, publishing and release out of mandatory hooks. Developers may run them explicitly before pushing risky changes.

Hooks can be bypassed or absent, so none of the present validation checks should move exclusively to local execution. Formatting fixes, editor lint feedback and manual preview servers are the useful local-only activities.

## Follow-up work kept separate

- Contract-test commands were commented out in both PR workflows. OpenAPI lint and browser E2E do not prove those consumer/server contracts. Validate and budget the existing contract targets in a focused follow-up before enabling them; removing stale comments does not mean they are covered elsewhere.
- Review docs caching before expanding it: `docs-hub:build` consumes catalog/package README data beyond its explicit inputs, `docs-hub:verify` consumes build output, and Compodoc merge hashing references ignored `dist` files. Model producer/consumer dependencies and test cold-versus-restored output in a dedicated change. Do not further reduce docs coverage based on these existing cache declarations.
- Pages path filters omit general library-source and dependency changes even though generated API/Storybook content depends on them. Revisit publishing triggers with the docs caching work.
- Review coverage of inferred `typecheck` targets before adding them wholesale. Some are separate compiler checks; others overlap an existing package or application build. The PR preserves existing execution coverage.
- The GitHub-managed `Push on main`/Nx integration run is not a checked-in push workflow. Inspect its Nx Cloud configuration before assuming another repository YAML job duplicates it.

## References

- [Nx affected execution](https://nx.dev/docs/features/ci-features/affected)
- [Nx cache inputs and outputs](https://nx.dev/docs/concepts/how-caching-works)
- [Nx environment variables](https://nx.dev/docs/reference/environment-variables)
- [Nx Cloud startup and lifecycle commands](https://nx.dev/docs/reference/nx-cloud-cli)

`NX_NO_CLOUD` disables Cloud for an invocation; disabling distribution alone still permits remote caching. Local caching is a separate choice. Tasks involving external state need an explicit freshness policy in addition to an execution location.
