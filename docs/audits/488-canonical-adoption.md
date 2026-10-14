# Auth and Identity canonical adoption readiness

Issue [#488](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/488)
requires canonical Auth/Identity adoption while preserving existing behavior.
Auth Contracts `0.1.0` is now published, resolving the configurable-profile gap
found in `0.0.1`. The implementation on `feat/488-canonical-auth-identity-contracts`
pins Auth `0.1.0` and Identity `0.0.1`, derives TypeBox compatibility bindings,
and retains the existing Nest/Angular providers. The earlier sections below
record the upstream investigation; the current integration record follows them.

## Architecture and source revisions

Reviewed all 20 local ADRs under `docs/adr` at Bricks revision
`879eec0e83f7a7125641c0ae44598be0dffa6bd1`, and all 16 Meta ADRs under `adr`
at `a66c525132cab0e59d12d55a92bb0d1830953f8e`, including proposals and historical
records. The repository inventory and contributor documentation identified no
additional local ADR directory.

Applicable decisions are Meta ADR-0012 and local ADR-0016 for canonical ownership;
Meta ADR-0008–0011 and local ADR-0011–0015 for presentation, runtime compatibility,
auth and policy preservation; and the accepted Modern Angular decision for
consumer boundaries. ADR-0016 supersedes earlier local HTTP-authority language.
Nest 11 remains patch-only. Native Nest authentication, authorization and HTTP
adapter changes remain separate work. Proposed governance and Newsletter
amendments do not override accepted decisions.

The TS Contracts, Nest, Auth Contract Migration, frozen #487 audit, Modern Angular
guide/application and architecture/provider/forms/testing guidance establish the
relevant constraints: preserve public exports, configurable profiles, payload
shaping, Fastify behavior and explicitly provided Angular state. Do not author a
second canonical schema set in Bricks. Policy meaning and application invariants
remain local.

## Published artifact evidence

Both npm tarballs were downloaded with lifecycle scripts disabled and installed
into a temporary consumer. Downloaded integrity values match registry metadata:

| Package                            | Version | SHA-512 integrity                                                                                 |
| ---------------------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| `@anarchitects/auth-contracts`     | `0.0.1` | `sha512-LRlvXr1xvFanHeoWY9iI4WDho7pfQyMK0uV77YwvUWcxIMCTtioCdznqNiw7ZJI2HvuhmivNFySciRQWapgpbQ==` |
| `@anarchitects/identity-contracts` | `0.0.1` | `sha512-bXg0BZfdhtPUhh/ajZSQJ3kIrfzWAffeN2DQrNIAy9o7DpaVE+Y3dKzFfm0xfCPU1dcLfP1dlakW/YwSdhaDBw==` |

The corresponding Git tags resolve to
`1f8240b62b5533b136610ea44ebf16fe6b7efae4`. This observation does not verify
registry provenance or byte equality with a rebuild of that commit. No GitHub
Releases were returned at observation time. Stale package README statements that
the workspace is unreleased do not negate the observed npm distribution.

Canonical compatibility records were read at that tag:
[Auth](https://github.com/anarchitects/anarchitecture-contracts/blob/1f8240b62b5533b136610ea44ebf16fe6b7efae4/packages/auth/compatibility/README.md)
and [Identity](https://github.com/anarchitects/anarchitecture-contracts/blob/1f8240b62b5533b136610ea44ebf16fe6b7efae4/packages/identity/compatibility/README.md).
Their schemas preserve audited coercion, unknown-field and null behavior.
Canonical manifests distinguish publication validity from implementation and
deployment evidence. Unresolved security bindings are downstream obligations,
not missing package publication and not permission to expose protected routes.

## Configurable Auth profile gap

Bricks exposes [createAuthContracts](../../libs/auth/ts/src/contracts/auth-contracts.factory.ts)
and [AuthContractConfig](../../libs/auth/ts/src/contracts/auth-contract.config.ts).
The [Nest presentation module](../../libs/auth/nest/src/presentation/presentation.module.ts)
uses the configured factory output as route schemas. The
[Angular provider](../../libs/auth/angular/config/src/providers.ts)
uses the same factory for form metadata and payload handling.
The [migration guide](../guides/auth-contracts-migration.md) explicitly supports
required-field, length and empty-string customization.

The published canonical package exports fixed request schemas. Its `authProfiles`
export describes capability/security binding requirements; it is not a field-rule
configuration factory. There is no public configurable schema factory in any
published Auth subpath.

A direct comparison used the existing Bricks factory and TypeBox `Value.Check`
against the installed canonical `LoginRequestSchema.safeParse`. Both payloads
used `credential: "person@example.com"`; only the configured password minimum
changed from the default profile:

| Configured minimum | Password   | Existing configured schema | Canonical 0.0.1 |
| ------------------ | ---------- | -------------------------- | --------------- |
| 10                 | `12345678` | Rejects                    | Accepts         |
| 3                  | `1234`     | Accepts                    | Rejects         |

These string-only cases establish a schema-acceptance discrepancy independently
of coercion. They do not claim that the authentication engine accepts either
password or that an HTTP conformance suite has run. Existing Nest and Angular
tests also assert profile overrides, including required registration names and
custom password minimums.

Replacing every configured schema with the fixed canonical export would therefore
relax some host constraints and reject previously permitted inputs elsewhere.
Adding locally authored Zod variants would conflict with canonical ownership.
Retaining the legacy custom-profile path can support an explicitly bounded staged
migration, but cannot establish full canonical adoption for those profiles.

## Required upstream handoff and adoption sequence

1. The approved direction is a separately tracked Contracts configuration/factory
   change under [Contracts #23](https://github.com/anarchitects/anarchitecture-contracts/issues/23),
   a sub-issue of Contracts epic #1, preserving the existing configurable Auth rules.
   Preserve omission, lengths, required fields, email grammar, Unicode handling,
   coercion and unknown fields. Keep frontend empty-string shaping distinct from
   server schema behavior; do not infer server rejection from presentation metadata.
2. Include deterministic operation/schema and OpenAPI projection support for the
   configured variants. Test default parity plus stricter and relaxed profiles.
   Publish a new immutable version under Contracts' compatibility/release rules;
   do not replace `0.0.1` artifacts.
3. Pin the reviewed package versions in Bricks and replace authoring with derived
   compatibility bindings. Preserve TypeBox exports and their consumer semantics
   until verified replacement gates pass. Keep the existing generator and operation
   metadata as transitional evidence.
4. Verify real positive/negative HTTP behavior on supported Nest hosts, including
   errors/statuses, cookies, JWT, passkeys, policy denials and Identity mapping.
   Verify Angular types/profile behavior and clean packed consumers. Report support
   by exact contract version and capability; full conformance CI remains #490.

## Upstream preparation on 2026-10-14

The separate `feat/configurable-auth-contracts` branch is prepared in the isolated
local checkout `/tmp/contracts-auth-profiles`. It adds the typed canonical factory,
default schema compatibility, configuration-bound OpenAPI generation, and draft
P07/compatibility review records. No configurable Zod factory is authored in Bricks.

Upstream validation passes 4,536 differential field cases against the frozen
Bricks factory, existing contract behavior suites, package builds/types and clean
ESM/CommonJS/TypeScript 5.5/6/browser consumers. Three new OpenAPI tests pass,
including unchanged default projected constraints, deterministic custom variants
and refusal of stale configuration evidence. These are bounded schema/package
results, not implementing-host conformance.

The user subsequently approved all 31 pinned P07 records explicitly. Commit
`b592c4d47e78c914825abac7e080f9ed31739314` records the approval and regenerates the
canonical artifacts. The user then separately approved both exact migration
baselines, all four `0.1.0` intents, and commit/push to PR #24.

The migration gate now accepts both exact approvals per package, rejecting stale,
missing, draft, incomplete or ambiguous matches. All four generated inventories
remain unchanged outside projection-review metadata. No published version is
rewritten; no default HTTP wire change is claimed.

At the user's request, PR #24 also aligns Contracts with the Nx 23 zero-major
behavior used by Bricks 3-tier, Community and Plugins:
`adjustSemverBumpsForZeroMajorVersion: true`. Before 1.0, features and fixes map to
patches, declared breaks to minors; the compatibility minima and real Nx/Git
fixtures follow that policy. ADR-0004/Meta ADR-0013 did not require the previous
`false` override. The current conservative findings still require a minor for
changed published projection/source provenance: old source/generator-bound
reviews cannot approve the new artifacts. This tooling/artifact impact is
explicitly disclosed in commit `11d13ea`, without claiming a default wire break.
The complete 22-task upstream `yarn check` passes without cache, including release
smoke, 29 OpenAPI tests and 17 release-unit tests. Commit/squash-title validation
and PR-base compatibility pass; Nx derives `0.1.0` for all four packages. Publication
and registry integrity remain outstanding; existing `0.0.1` is preserved.

The user explicitly authorized a one-time exception for the feature-branch commit,
push and draft PR. Commit `9e564329318e67143a87d21fd1bef36b4fff2096` is pushed and
GitHub reports its signature as valid. [Contracts PR #24](https://github.com/anarchitects/anarchitecture-contracts/pull/24)
is open for issue #23. The initial exception did not approve P07; that approval
was supplied separately afterward. The later migration/versioning approval also permits commit/push; none of these
approvals permits merge or publication.
After the upstream review/release gates, #488 still needs exact
package pins, derived TypeBox adapters, Nest/Angular integration and the
HTTP/Identity checks listed above. #488 and #485 remain Blocked; upstream #23
is In Review. No release or publication has occurred for this change.

At that earlier audit-only stage, no runtime, manifest, lockfile, generated
OpenAPI or public export changes had been made. No breaking change or npm deprecation is introduced. Silently removing
or changing configurable profiles would be a breaking change requiring explicit
review. This audit is readiness evidence, not completion of #488 or parent #485.

## Registry history and GitHub Release recovery

CI on upstream `11d13ea` passed workspace and Node 22/24 packed-consumer checks,
then found npm's automatic `0.0.0-stage` holding packages. npm documents these
as the result of staging a new package; inspection verified their `stub: true`
metadata, exact SHA-512 hashes, and lack of runtime code. Upstream `069d474` pins
the four known placeholders and keeps rejecting untagged genuine releases or
unverified stage variants. Full local checks and the exact remote GitHub/npm
history path used by CI pass; package compatibility against main also passes.

The user confirmed manually publishing npm `0.0.1` and explicitly authorized
creating the missing GitHub Releases. All four GitHub Releases now exist on the
original signed tags at `1f8240b62b5533b136610ea44ebf16fe6b7efae4`. npm integrity
and tagged canonical manifests/OpenAPI/README/license bytes were verified. No tag
or npm package was replaced. Their automatic historical Publish runs stop on the
old changelog formatting/Markdown checks before npm publication; this does not
invalidate the recovered GitHub Releases or the existing npm artifacts.

This recovers the existing `0.0.1` release records only. Configurable Auth still
requires the future published version and Bricks integration; #488 remains blocked.

## Published version and Bricks integration

[Contracts issue #23](https://github.com/anarchitects/anarchitecture-contracts/issues/23)
was merged through [PR #24](https://github.com/anarchitects/anarchitecture-contracts/pull/24)
at `77f6b1872660d823c4834d1c6f4b79ce0c43cf9f`. Auth `0.1.0` was published from
`b422b547501d0db7291e759f8f941c5b646f7e37`.
Its downloaded tarball matches registry SHA-512:
`sha512-XEs4OuvICv4GBSeeRA6wlPdOJBqc3ed7ttFwlAOYePABY+49XMLE44ncQrRW5cHFK+CZbwt+Yb7urQH6pb918w==`.
The registry exposes a provenance attestation; this record does not claim a
separate cryptographic verification of that attestation. Identity stays on the
previously verified `0.0.1`; adoption does not require releasing other domains.

The root install, both publishable TS manifests and consumer fixture locks pin
the canonical packages exactly. Zod is pinned to `4.5.0`. Config/default types
are re-exported from Contracts. The Auth compatibility adapter derives configured
requests, session/account/JWT/passkey schemas and policy representation from the
published graph; Identity derives its request/response fields from its published
graph. Neither package contains an independently authored configurable Zod factory.

Bindings are deliberately bounded to these exact versions. Fastify/AJV retains
coercion, stripping and error formatting; TypeBox `Value.Check` retains its legacy
non-coercing API. Opaque JSON stays `unknown` in the legacy DTO surface. Identity
request DTOs retain nullable fields before Fastify's string-first coercion.
Auth form metadata comes from the validated canonical configuration;
`shapeAuthPayload` remains separate from server validation. Auth policy meaning,
CASL evaluation, guard wiring, HTTP routes, cookies and engine behavior remain local.

Compatibility tests compare the bindings against schemas frozen from Bricks
`879eec0e83f7a7125641c0ae44598be0dffa6bd1` and compare request results against the
actual published canonical parsers. Frozen files under each TS package's
`tests/fixtures` are test oracles, not contract authority. Coverage includes
stricter/default/relaxed profiles, scalar and singleton-array coercion, nulls,
Unicode, overflow numbers, email grammar, nested passkey stripping and unknown
fields. Empty-string shaping is tested independently.

Compiler compatibility requires export-aware module resolution. The TS libraries
use `bundler`; Nest builds use `NodeNext` and still emit CommonJS. Nest's Jest
transform remains CommonJS with isolated transpilation; builds and packed hosts
perform declaration type-checking. Consumers still using TypeScript `node10`
resolution must migrate; this is a compiler-configuration compatibility impact
that must be disclosed in the Bricks release. No npm deprecation is proposed.

The default generated OpenAPI is unchanged. `api-specs:diff` now exits successfully
when the source and destination bytes are identical. The legacy comparator still
cannot generally compare changed OpenAPI 3.1 nullable schemas by merely changing
the document version to 3.0.3; repairing that general comparator is separate work.
Generation/lint/verification and exact byte equality provide the evidence here.
A custom host must use Contracts' configured OpenAPI generation and review gates.
Full deployment conformance CI remains tracked in #490.

## Verification and review handoff

Local evidence on macOS arm64, Node `24.21.0`, 2026-10-14:

- All 28 applicable Nx build/test/lint/typecheck tasks passed across Auth/Identity
  TS, Nest and Angular, release tooling and their build dependencies.
- Auth TS: 226 tests; Identity TS: 25 tests. These include the new frozen-oracle
  and canonical-parser comparisons. Auth Nest: 257 tests plus its passkey target.
- All six clean packed consumer hosts passed: Auth and Forms/Identity, each on
  Nest `11.1.6`, Nest `11.1.6` with modern integrations, and Nest `12.1.2`.
  Strict NodeNext compilation, CJS/ESM cold loading of every TS export, real
  Fastify routes, PostgreSQL workflows, sessions/cookies, JWT, authorization and
  passkey persistence remain covered. Configured password minima 10 and 3 are
  additionally checked over HTTP on all three Auth hosts.
- Existing registry versions and integrities are unchanged in all six locks.
  Only the pinned canonical packages/Zod and first-party dependency metadata
  were added. Lock refresh now preserves existing registry resolution.
- OpenAPI generation, lint, verification and exact diff passed. The generated
  JSON/YAML are byte-identical to `origin/main`. Docs content/build/verify passed.

Packed tests exposed a declaration that inferred a workspace-relative import and
an Auth CommonJS chunk-initialization cycle. Explicit public passkey response
types and preserved module boundaries fix these; TypeBox subpaths remain external
runtime dependencies. Cold-loading each packed export protects the packaging fix.

This is local evidence for the listed versions, not new Linux CI results or
certification of every supported Node/peer combination. The existing PR matrix
must run on the reviewed change. Review, commit, PR creation and merge remain
human-owned under AGENTS.md. #488 is ready for review; parent #485 remains active
for the other adoption work. No Bricks release or npm publication is performed.

Suggested commit: `feat!: adopt canonical Auth and Identity contracts`.
Disclose the export-aware TypeScript resolution requirement in its breaking-change
footer; default HTTP behavior and TypeBox DTO names remain preserved.
