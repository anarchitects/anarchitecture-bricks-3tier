# Forms and Newsletter canonical adoption — #489

## Architecture preflight and scope

Reviewed all 20 repository ADRs at `268f6d46730ae8fe16816abd61c4f789666cc227`
and all 16 Meta ADRs at `a66c525132cab0e59d12d55a92bb0d1830953f8e`, including
proposals and historical decisions. The documented ADR locations are `docs/adr`
here and `adr` in Meta. No additional package AGENTS.md applies.

Accepted Meta ADR-0012 and local ADR-0016 govern canonical HTTP ownership.
Local ADR-0005–0009 preserve Forms as configurable intake; domain definition
compilation and validation remain here. ADR-0010 preserves Newsletter consent,
native lifecycle, optional provider adapters, raw signed bytes and explicit
rate-limiter composition. ADR-0011–0015 require existing Fastify/runtime behavior,
packed consumers and separation from Nest 12-native modernization. Proposed
Newsletter/governance amendments do not independently authorize changes.

The TS Contracts, Nest, Newsletter integration/migration, packed release validation,
DDD alignment/migration and Modern Angular guide/application plus architecture,
forms and testing guides were reviewed. Angular state/providers and business
models stay local. No new provider adapter, auth provider, persistence schema or
release change is included.

The compatibility-first direction has an explicit security exception: the
[maintainer decision on #489](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/489#issuecomment-6146772001)
requires D05 server validation and D08 removal of public delivery secrets now.
[Contracts' migration requirements](https://github.com/anarchitects/anarchitecture-contracts/blob/main/docs/forms-security-migration.md)
define the safe target DTOs and remaining review gates. Preserving the insecure
behavior is not an accepted alternative. These are deliberate breaking security
changes, not incidental schema-converter differences.

## Immutable dependencies

Both packages are consumed at exactly `0.1.0`, with Zod `4.5.0`. Downloaded npm
pack integrity matched the registry on 2026-10-14:

| Package                              | SHA-512                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `@anarchitects/forms-contracts`      | `sha512-zUkIN01MgzaTt3F8xL1VSWA3d39nIGptBTV8wj2AA0Kq+khUlwRiAVqdJ25H4NPODD4HxsbaQ+pFB0abXJR2lQ==` |
| `@anarchitects/newsletter-contracts` | `sha512-dK5KEWlU3pgECwmRiMej/FXGdKfDkbj8ygavKtvX85vDYxo64jxXE1PbNPKPpgYiiU2zcz8pbsIzdG9Y0D99QA==` |

Publication does not establish deployed-host conformance. Stale unreleased wording
in package READMEs is historical; the registry artifacts and package versions
were inspected directly. The published compatibility records preserve unresolved
host security bindings and Forms D05/D08 blockers.

## Integration boundaries

Existing public TypeBox DTO names remain available through bounded adapters derived
from the canonical graph. Frozen schemas from the Bricks revision above are
comparison fixtures only. Requests preserve audited coercion, unknown transport
fields, integer versions and opaque payloads. Response dates, legacy format
validators and opaque JSON type surfaces remain compatible.

Forms' new public definition DTOs derive from the canonical `PublicFormDefinition*`
exports. The controller explicitly maps safe fields and regenerates the dynamic
schema from that public config. It never forwards delivery configuration or
arbitrary adapter schema metadata. Legacy DTOs/mappers remain for compatibility;
they are not approved public or administrative read responses. The new restricted
management helper exposes only `{ configured }`, without adding a management route.

Submissions validate against the fetched version before storage or mail, reject
unknown payload fields, enforce field formats/types/lengths/select values and
cross-field equality, and return the existing Nest 400 envelope. Optional fields
remain optional in the dynamic schema; the former TypeBox builder accidentally
made every declared field required. Infrastructure errors are sanitized without
logging their potentially secret-bearing messages. Definition lookup remains 404.

Newsletter's compatibility schemas retain TypeBox Value UTF-16 length behavior.
Presentation uses the canonical runtime parser without coercion; the honeypot
short-circuit still precedes ordinary validation and limiting. Webhooks authenticate
the exact raw bytes before UTF-8/JSON decoding and canonical payload validation.
Account matching, limits, normalization, durable deduplication, consent ordering,
double opt-in and native token rules stay in their existing implementations.
JSON Schema/OpenAPI alone does not encode every canonical refinement.

Forms/Newsletter operation IDs are consumed from the published operation arrays.
The working implementation OpenAPI generator remains. Its Forms response uses the
published public migration target; canonical `formsOperations` still records the
frozen legacy response and blocked capabilities. Do not describe these as identical
operation profiles or clear upstream blockers from local output changes.

## Migration and remaining release gates

This work requires a reviewed pre-1.0 minor Forms release, coordinated across the
domain. Consumers must handle 400 for formerly accepted invalid submissions and
stop depending on public delivery fields. Compiler consumers must use export-aware
resolution (`NodeNext`, supported `Node16`, or `bundler`), as with #488. Nest remains
CommonJS; runtime support is verified independently of workspace tooling.

Before rollout, the host must:

1. Bind authentication and per-resource authorization for definitions and stored
   submissions. The library does not invent a host's access policy. Test 401/403
   and ownership with the actual deployed guards; fixture tokens are not a
   production security binding.
2. Audit each deployed versioned definition and existing submissions. Review invalid
   historical data separately; no automatic deletion, replay, backfill or mail is
   performed. Fix callers and form definitions before enabling the new line.
3. Treat delivery settings as write-only secrets. Inventory exposed keys and rotate
   webhook secrets/credential-bearing URLs at their owning services. Remove leaked
   values from caches and review logs/access under the host's procedures. Repository
   tests use dummy rotated values; no actual deployed secret is rotated here.
4. Review the exact implementation evidence and update Contracts' versioned D05/D08
   operation migration/profile records. Published `0.1.0` is immutable; its blockers
   remain. Full Forms capability/deployment approval is not claimed by this PR.
5. Pass Linux packed-consumer CI, the supported runtime matrix and the subsequent
   #490 conformance gate before release. A rollback disables affected capabilities
   or uses a verified secure version; it must not restore validation bypass or
   secret disclosure.

These fixes may warrant deprecation of affected published Forms versions after a
secure replacement is available and affected versions are identified. This is a
proposal for maintainer review only; no npm deprecation, release or publication
is authorized or executed by this implementation.

## Validation record

Local evidence on macOS arm64, Node `24.21.0`, 2026-10-14:

- Applicable Nx build/test/lint/typecheck targets passed for Forms and Newsletter
  TS, Nest and Angular, Auth Angular, and release tooling. Forms TS has 74 tests,
  including frozen DTO graph and canonical parser comparisons; Newsletter adds
  analogous legacy/canonical differential coverage. Forms HTTP migration tests
  cover exact-version selection, optional fields, missing/invalid/extra fields,
  select membership plus length/pattern constraints, cross-field equality, and
  absence of storage/mail on invalid submissions.
- All eight clean packed consumers passed: Forms/Identity on `nest11`,
  `nest11-modern` and `nest12`; Newsletter on those three plus `nest11-optional`
  and `nest12-optional`. They use strict NodeNext declaration compilation,
  independent ESM/CommonJS loading, real Fastify and PostgreSQL. Existing native
  Newsletter restart/replay/withdrawal, MailerLite raw-byte signatures and durable
  deduplication, rate limiting, and optional dependency behavior remain covered.
  Forms packed tests exercise dynamic rejection and safe definition serialization.
  The final select-constraint refinement was additionally checked through Forms
  TS/Nest/Angular tasks and the Nest 12 packed host.
- All eight locks preserve every pre-existing registry version and integrity.
  Only first-party metadata and the new canonical/Zod dependency entries changed.
  Newsletter lock refresh now preserves registry resolution, matching the other
  host harnesses.
- `release-tools:validate-nest-package-compatibility` passed source, distribution,
  packed-manifest and exported-file checks for all six Nest packages.
- OpenAPI generation, lint and route verification passed. Structural comparison
  with `268f6d4` confirms the only generated document change is the Forms definition
  200 response: delivery is removed and the public target is strict. All consumed
  Forms/Newsletter operation methods, paths, IDs and tags match their canonical
  definitions; the intentional Forms response migration is described above.
- `api-specs:diff` remains **failing** with `OPENAPI_DIFF_PARSE_ERROR`: its existing
  OpenAPI 3.0 comparator cannot parse the pre-existing OpenAPI 3.1 nullable schemas
  merely by relabelling the version. #488 documented this limitation; its equality
  shortcut cannot apply to this intentionally changed document. No comparator or
  snapshot bypass was added. Structural comparison and migration evidence do not
  claim that this gate passed; a 3.1-capable comparator remains follow-up work.
- Documentation content/build/verify, ESLint for changed harness/route tooling and
  `git diff --check` passed.

These are local results, not Linux CI results or certification of every supported
runtime. Host policy, deployed secret rotation and versioned upstream operation
migration remain review/release gates. No Bricks release, npm publication or
package deprecation was performed. #489 is handed off for human review; parent
#485 remains active. The maintainer subsequently explicitly authorized the agent
to commit this change and open its PR. Human review, merge and release ownership
remain unchanged.

Suggested commit: `feat!: adopt canonical Forms and Newsletter contracts`.
Its breaking-change footer should disclose Forms payload enforcement, removal of
public delivery data and the export-aware TypeScript resolution requirement.
