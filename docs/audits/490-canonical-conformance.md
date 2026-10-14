# Canonical conformance CI — #490

## Architecture preflight

All 20 repository ADRs at `7917790a6c3b10eac4ada544c24426340c0eabb1`
and all 16 Meta ADRs at `a66c525132cab0e59d12d55a92bb0d1830953f8e`
were enumerated and read, including proposed, historical and superseded records.
Relevant TS Contracts, Nest, Auth migration, legacy API baseline, packed release
validation/release plan, DDD alignment/migration and CI/contribution guides were
reviewed. Meta ADR-0012/local ADR-0016 reserve public schemas, operation metadata
and canonical generation for Contracts. Meta ADR-0013/local ADR-0017 require
exact Nx project commit scopes and reviewed pre-1.0 breaking releases.

This change concerns implementation evidence and CI orchestration. It preserves
Fastify, TypeBox compatibility exports and the patch-only Nest 11 maintenance
policy. It introduces no native Nest authentication or authorization migration.
The applicable tooling scopes are `api-specs` and `release-tools`; human review,
commit, PR acceptance and releases remain separate actions.

## Published inputs and conflicts

Auth and Newsletter use exact Contracts `0.1.0`; Forms uses `0.2.0`;
Identity uses `0.0.1`.
Canonical OpenAPI 3.1 and inventories are loaded through published package exports
and checked against their manifests' artifact hashes and root dependency pins.
Immutable Yarn installation verifies package distribution integrity.

The canonical documents intentionally omit protected operations whose host
bindings are unresolved. The complete inventory remains normative, including
security requirements. Empty Forms/Identity `paths` must never produce a vacuous
conformance pass. Canonical Zod behavior is required in addition to OpenAPI:
coercion, payload shaping, dynamic Forms validation and byte-exact signatures
cannot be inferred from a JSON Schema comparison.

Forms `getFormDefinition` in published 0.2.0 now uses the safe public response
implemented by #489 under the
[approved security migration](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/489#issuecomment-6146772001).
D05/D08 and exact deployed-host evidence remain unresolved upstream. No local
report, test or snapshot clears those blockers or approves exposed-secret rotation.

## Evidence scope

The generator collects implementation schemas from actual Nest controllers,
including the existing optional JWT controller. IDs and tags come exclusively
from published operation definitions. It uses service fixtures for documentation;
its output does not describe a production host's security configuration.

Route inventory validation is distinct from schema and host conformance. The
comparison report records request, parameter, response and security differences
against canonical 3.1 without relabeling the dialect as 3.0. Empty supported
capability lists are intentional until exact-profile host evidence is reviewed.

## Implemented gates

- All 29 route IDs/tags derive from the published operation arrays. The generator
  additionally mounts the existing JWT controller; no runtime route is added.
- Artifact/inventory checks reject missing operations, wrong success statuses,
  mutable version ranges and hash drift. The comparison keeps OpenAPI 3.1 and
  records unresolved request/response/security differences without approving them.
- Existing-operation changes require an exact human-approved compatibility record
  binding before/after wire hashes and canonical artifacts. The old editable
  snapshot target/files and unused 3.0-only `openapi-diff` dependency are removed;
  #487's immutable Git-based audit remains intact.
- Packed hosts use TCP for the observed requests, validate response bodies and
  present headers through installed Contracts schemas, and fail if any operation
  lacks a successful response or a domain lacks negative cases. Explicit disabled
  capabilities assert absence separately. Logs include package versions and
  canonical artifact hashes.
- Ten Auth recovery/passkey outcomes additionally use labelled adapter-only
  doubles. They test serialization, input rejection and repeated cookies, not
  cryptographic or recovery-token acceptance. Existing real session/guard,
  passkey verifier/persistence/browser and runtime matrix suites remain required.
- PR CI runs artifact, compatibility, mutation and packed HTTP checks. Release CI
  reruns artifact and packed HTTP checks. The domain runner validates actual Nx
  proposed versions against each package tag before release mutation: canonical
  adoption/wire changes cannot be forced into an insufficient patch.
- Commit validation uses exact names from the Nx graph and configured commit
  types, including the PR squash title. It inspects PR-side commits only; merged
  history is not rewritten. Public READMEs link exact canonical support and limits.

The Modern Angular guide, repository application and testing/release guidance
were reread for the public README scope. The passkey guide was reread before the
additional transport probes. No Angular implementation, state scope, package version or production security
setting changes. The Forms contract dependency update is recorded below.

## Validation and remaining acceptance

Local environment: macOS arm64, Node 24.21.0. Artifact generation, canonical
inventory/compatibility checks, spectral lint, tooling lint/mutation tests,
release-tool/guardrail tests and docs content/build/link validation passed.
The three fresh packed Nest 11 hosts passed with successful responses for all 29
operation IDs and negative cases in each domain. Auth includes actual sessions,
JWT and guards plus the explicitly separated adapter probes; Forms/Identity and
Newsletter retain database, no-side-effect, lifecycle, raw-byte signature, limit
and replay assertions. The existing Nest 12 consumers were also verified; this
is local evidence, not a new Linux CI or deployed-host approval.

A real Nx Forms-domain **dry run** passed the proposed-version gate. It selected
Forms 0.12.0 and the existing dependency cascades Auth 0.13.0 and Newsletter 0.2.0.
These are observed proposals, not a release request or publication. A separate real dry run with `--bump=patch` failed as intended: Forms Angular
required at least 0.12.0 while Nx proposed 0.11.1. Unit regressions additionally
reject null/insufficient prerelease proposals and missing history.
The validation runs performed no commit, tag, push, GitHub release, npm publication
or deprecation.

Contracts issue #25 and PR #26 resolved the Forms operation/profile discrepancy;
Forms 0.2.0 is published and pinned here. Host conformance still requires
independent reviewed evidence.
Actual deployed authentication/resource policies, exact configured Auth OpenAPI,
Forms secret inventory/rotation and host compliance still need their owners'
review. These controls cannot be cleared from this fixture suite.

The CI changes introduce no additional HTTP behavior change beyond #489. The
Forms 0.2.0 dependency adoption below retains that breaking canonical migration
and the release floor. This work strengthens
CI/release rejection criteria, uses an unscoped repository-wide release commit
subject instead of the nonexistent `release` scope, and retains the already-disclosed #488/#489 migration
requirements. It adds no new npm deprecation proposal. Suggested implementation
commits use `ci(api-specs): verify pinned contracts over HTTP` and
`fix(release-tools): enforce Nx scopes and contract release floors`; documentation
may be a separate repository-wide `docs:` commit. The Forms dependency adoption
uses `fix(forms-ts)!: adopt canonical Forms 0.2.0`, disclosing the canonical
removal of delivery fields already implemented by #489. Work remains In Review pending
human acceptance; #485 remains active.

## Forms 0.2.0 adoption follow-up — 2026-10-14

All 20 local and 16 Meta ADRs were re-enumerated and reviewed at the same revisions
listed above, together with the relevant TS/Nest, packed-consumer and Angular
documentation guides. Meta ADR-0012/local ADR-0016 require immutable canonical
consumption; Meta ADR-0013/local ADR-0017 retain exact Nx scopes and compatibility
release gates. No new architecture conflict was found. The previously identified
D08 operation discrepancy is resolved by the separately reviewed upstream release.

Published input: `@anarchitects/forms-contracts@0.2.0`, registry git revision
`90d9b6b28dd7218485dffe69d2d854333012c154`, npm integrity
`sha512-9BuQY4/1/i+kD3bs6fjroWF5diFKGaRZcqzzboEfI6it4q+4jeKDjwVJuYJluzSWmLgd0BuGNaUw8pRDNyi96Q==`.
The downloaded package README, operations, manifest, upstream compatibility rules
and D05/D08 migration requirements were reviewed before updating the root and
Forms TS pins. Published 0.1.0 artifacts and frozen legacy evidence remain intact.

The packed HTTP assertion now uses the published operation response directly;
the previous D08 schema substitution is removed. Mapper regression coverage
validates the serialized public DTO against that operation and rejects injected
delivery configuration. TypeBox compatibility exports and runtime support remain.
This adopts a breaking canonical contract version, while retaining the already
implemented #489 safe wire behavior. Consumers of legacy delivery fields still
need the documented migration; rollback must never restore secret exposure or
dynamic-validation bypass. No additional deprecation action is proposed.

The canonical artifact hashes are `042bb8197d27514a4def0fcfc801234271961325d8e321f400b4a619d6a21fca`
(JSON) and `be5edb700186a4aaa91ed7e6b87b5b7640f2ca5b30e2f5d4ccc45741943f7997`
(inventory). All three Forms/Identity consumer locks preserve unrelated registry
versions and integrity records. Validation results follow below.
D05 remains exact-version dynamic validation before side effects. D08 remains
public projection plus separately reviewed access, logs and historical secret
rotation evidence. Publication and fixture success do not clear either host gate.

### Fresh validation against the published package

All checks passed locally on macOS arm64, Node 24.21.0:

- Immutable Yarn install; Forms TS lint/types and 74 tests; Forms Nest 103 tests;
  Forms Angular build and 97 tests.
- `release-tools:validate-nest-package-compatibility`: source/build/packed
  contracts and public exports pass; 83 release-tool tests pass.
- `api-specs` generation, lint, tooling lint, verification, compatibility diff
  and all 8 conformance mutation tests pass against the pinned artifact hashes.
- `api-specs:conformance-http` on Nest 11 and `:nest12`: all 29 operations have
  successful TCP response evidence and each domain has negative responses.
  Forms reports contract version 0.2.0 and the canonical JSON hash above.
  Every Forms definition response is checked against `published-operation`;
  there is no alternate D08 response schema in the HTTP assertion.
- `release-tools:test-forms-identity-nest-compatibility:nest11-modern` passes
  with its freshly installed locked consumer, completing all three Forms lanes.
- Forms D05 cases retain exact-version lookup and required/email/type/unknown-key
  rejection, the canonical 400 envelope, and zero database/mail effects. D08
  fixtures configure credential-bearing delivery but return no delivery data or
  fixture secrets. Neither case proves a production access policy or rotation.
- Documentation content/build/link verification, formatting and `git diff --check`
  pass. No unreviewed compatibility approval or production capability claim is added.

This is evidence for the local candidate source, not a new Linux CI result.
Human acceptance and release gates remain. #490 is In Review and parent #485
remains In Progress. After validation, the maintainer explicitly requested commits
and a PR for the complete #490 change. That authorization covers the feature branch
and review handoff only; no Bricks merge, release, publication or deprecation is
performed.
