# Nest 12 workspace adoption

Delivery: [#535](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/535),
under #501. Reviewed 2026-11-16 from Bricks
`f3dcf5b7c37ba5be3127bf2de894309971b6e8fa`.

## Architecture preflight

Read all 20 repository ADRs in `docs/adr` (0001–0017, 106, 121 and Modern
Angular), including historical clauses and the proposed Newsletter amendment.
Tracked/hidden-file enumeration and documented references found no other local
ADR location. Read all 25 Meta ADRs at
[`4f0339d`](https://github.com/anarchitects/anarchitecture-meta/tree/4f0339d86f0ebfa073173ad307cb67c8d6042bdd/adr),
including both 0001 records, both 0008 records and `ADR-0001.md`.
Cooperative governance and Meta 0005–0007 remain proposed.

Applicable accepted decisions: Meta 0008–0012 and local 0011–0016 preserve
Fastify behavior, canonical Contracts ownership, TypeORM, facade/secondary
exports and the separation of tooling from runtime compatibility. Meta
0013/0015–0019/0022 and local 0017 preserve build/cache/release ownership,
human acceptance and the prospective maintenance lifecycle. Existing dual-major
library peers remain intact; upgrading the development host does not withdraw
Nest 11 support or set an EOM date. Native authentication, authorization, mail,
Standard Schema and adapter migration remain #502–#506 work.

Reviewed the Nest implementation, development strategy, historical 11/12 audit,
release plan, packed validation, maintenance and release-routing guides; TS
contracts and canonical conformance; CI policy; DDD alignment and migration;
Modern Angular overview and repository application. No Angular implementation
change is planned. Reviewed the published plugin's initialization source,
dependency validator, registration helper, init/library schemas and adoption
guidance before execution.

Conflicts are resolved by status and dated evidence: the October guides' Nest 11
root freeze and plugin rejection are historical prerequisites, superseded for
this slice by accepted #500/#534 and the new published artifact. Meta 0022
supersedes older indefinite maintenance/feature permissions without retracting
advertised commitments. Native Node preference does not activate a new adapter
default. Project 15's existing status schema is retained; its `Todo` versus
Meta's `Ready` mismatch is separate planning work. DDD modernization is on
demand under #499, not a prerequisite to this root upgrade.

## Published plugin evidence

Plugins [#607](https://github.com/anarchitects/anarchitecture-plugins/issues/607)
is closed and `@anarchitects/nest@0.1.1` is published. Downloaded its exact npm
tarball and verified SHA-512 against registry integrity:

```text
sha512-o7F1YIhSv99FhcXoh9Ja/Dij535tlUmOi0qN/bWBaxf8Bpd6KC+AxZtufmJy98Fv7rOPZ2yArq/Pormam1ZpEw==
```

The registry provenance statement names Plugins commit
`b8a8b595f0a759dd4797267295859266a0ba4dd3`, tag `nx-nest@0.1.1`,
`.github/workflows/publish.yml` and
[run 43845772484](https://github.com/anarchitects/anarchitecture-plugins/actions/runs/43845772484).
Its subject digest matches the downloaded bytes; registry `gitHead` matches the
statement. This records inspected provenance, not independent Sigstore signature
verification.

The shipped validator accepts bounded stable Nest 11/12 library peers only with
compatible installed Nest 12 evidence from each declaring package. Init only
registers inference; it does not rewrite library builds or exports. The library
schema has no publishable/buildable options: replacing the obsolete
`@nx/nest:library` defaults with those options on the new generator is invalid.
Remove that obsolete block without introducing source-only ESM defaults for
published bricks. Repository search finds no other executable `@nx/nest` use
and no resolved build target owned by it. Keep the other Nx plugins.

## Adopted versions and development requirements

Fresh registry metadata selects common/core/testing/Fastify/Express **12.5.0**,
Config **12.1.1**, JWT **12.0.5**, TypeORM bridge **12.0.3**, Passport **12.0.2**,
CLI/schematics **12.0.13**, and plugin **0.1.1**. Preserve Nx **23.2.1**,
TypeScript **6.0.3**, Yarn **4.18.0**, TypeORM **1.1.1**, mail dependencies and
canonical contract pins. Passport has no current source imports; retain and align
the existing dependency rather than combining unrelated dependency cleanup.

CLI's optional SWC peer requires `^1.15.18`; upgrade the existing root SWC from
1.15.8 to 1.15.18. No compiler or Nx version change is needed.

Nest 12 dependencies are ESM. Jest 30.3 failed while parsing them; Jest **30.5.1**
and matching `jest-environment-node` support synchronous ESM loading through
Node's VM modules. Remove the old Faker transformation exception so ESM
dependencies load natively, while retaining ts-jest's CommonJS/decorator
transformation for repository tests. The built Mailer declaration consumer uses
TypeScript NodeNext (like the packed consumers) to model modern Node's
`require(esm)` support; strict checking remains enabled.

**Breaking development requirement:** use Node **24.22.3** from `.nvmrc` for this
workspace. Jest's `require(esm)` needs Node 24.9+, and the native plugin/CLI require
at least 24.15 on that line. Nx loads `.env.test` before forking test executors;
manually supplied `NODE_OPTIONS` must include `--experimental-vm-modules`.
See [Jest's ESM documentation](https://jestjs.io/docs/ecmascript-modules).
Jest cache inputs include that file and the effective environment variable.

PR, docs, passkey and Angular consumer workflow tooling follows `.nvmrc`.
The packed Nest workflow changes only its tooling runtime, retaining every
consumer Node/Nest lane. Custom agent templates install the same Node pin through
the official Nx step, retain the existing resource classes and 3/3/5 sizing, and
install dependencies immutably. Release/publish workflows already select Node 24.
This development-tooling change does not change any library's engines, peers,
exports, versions, release outputs or Fastify default. No npm deprecation is
warranted or proposed by this slice.

## Validation

Validated locally on macOS, Node 24.22.3, Yarn 4.18.0, Nx 23.2.1:

- `yarn install --immutable` succeeds with the final manifest/lock. Existing
  unrelated peer warnings remain; no Nest/CLI/SWC peer incompatibility remains.
- Inspected the supported `@anarchitects/nest:init` dry run, then ran it with
  `--buildTargetName=nest-build --startTargetName=nest-start --no-interactive`.
  It changed only plugin registration. A second dry run reports no changes.
- Resolved graphs before/after init have the same 30 projects, project dependency
  edges and target definitions. Subsequent Jest input additions only track the
  test environment. `@nx/js:tsc`, Vite declarations, Webpack example and all
  publishing targets retain their ownership. No existing app is inferred as a
  native CLI application in this slice.
- `release-tools:validate-nest-package-compatibility` passes all prerequisite
  builds and all six source/built/tarball manifest and exported-file checks.
- The five Nest implementation libraries' `test` targets pass with cache bypassed
  and **without** shell-supplied `NODE_OPTIONS`; Auth's prerequisite passkey tests
  also pass. `auth-declarations`, `guardrails` and `release-tools` tests pass.
- Lint passes for the six publishable Nest-dependent projects and Newsletter
  example. Newsletter example `build`, `typecheck` and `typecheck-tests` pass.
- API-specs `generate`, `lint`, `lint-tools`, `verify`, `diff` and `test` pass;
  generated OpenAPI artifacts have no working-tree changes.
- `release-tools:test-typeorm-persistence` passes against PostgreSQL and the root
  Nest/TypeORM bridge. Its expected rejected migration is part of the test.
- `auth-nest:test-published-adapter` passes PostgreSQL/Passkey adapter checks.
- `newsletter-nest-example:contract-test` passes both native and MailerLite
  paths: Forms/Angular client, real Fastify, database/mail, confirmation and
  withdrawal, signed raw-body webhook and deduplication.
- Documentation content validation, changed-file formatting and
  `git diff --check` pass. Agent YAML parses and distribution names resolve to
  the custom templates; this is configuration validation, not agent execution.

## Review and remaining proof

PR #539's first packed matrix exposed a declaration regression: all five Nest 11
lanes containing Auth fail with TS2694 because inferred `AuthorizedResource`
types refer to Nest 12-only `ParameterDecoratorOptions`. The Node 20 lane excludes
Auth and passes, as do the five Nest 12 lanes. Rechecked this repair against the
ADR inventory and ADR-0011/0014, Meta 0011, the Auth migration/contract guides and
packed release validation. Preserve the existing decorator call signature and
strict clean-consumer checks; no authorization semantics or HTTP contracts change.
Native authorization migration remains separate. The regression affects artifacts
built by this unmerged PR, with no evidence requiring published-version deprecation.

The repair explicitly types `AuthorizedResource` using the shared Nest 11/12
subject/pipe signature. Local validation on macOS and Node 24.22.3 passes the
complete `release-tools:test-nest-compatibility:nest11` suite, the clean Auth
`nest12` host, Auth unit tests and lint. All ten Nest 11 host configurations pass,
including strict declarations, CJS/ESM, HTTP, persistence and optional-peer cases.
The packed host checks remain uncached with `skipLibCheck: false`. Linux rerun
results are not claimed, and no ongoing CI monitoring is started.

This is #535's implementation for human review. Commit, push and PR creation are
explicitly authorized; no release, deprecation or support withdrawal is performed.
Existing Newsletter app CLI
migration is #536. #537 must still prove the exact new candidate through clean
packed runtime/canonical TCP hosts, cold/warm cache restoration and invalidation,
and Linux CI including the custom Nx agents. Existing fixtures pinned to Nest
12.1.2 are retained; their results must not be represented as 12.5.0 certification.
No live workflow or remote-agent success is claimed here.
