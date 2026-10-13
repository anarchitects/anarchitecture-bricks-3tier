# TS Contracts Guide

## Intent

This guide applies [local ADR-0016](https://github.com/anarchitects/anarchitecture-bricks-3tier/blob/main/docs/adr/0016-consume-canonical-public-api-contracts.md)
and [Accepted Meta ADR-0012](https://github.com/anarchitects/anarchitecture-meta/blob/main/adr/0012-canonical-public-api-contract-ownership.md).
It distinguishes canonical public HTTP contracts from local domain models and the
transitional TypeBox implementation. For UI behavior, see the
[Design/UI Systems Guide](/guides/design-ui-systems.html).

## Contract Ownership Model

- [`anarchitecture-contracts`](https://github.com/anarchitects/anarchitecture-contracts)
  owns shared public HTTP wire schemas and first-class operation definitions,
  authored Zod-first. Deterministic OpenAPI 3.1 JSON/YAML is an authoritative
  published artifact, never an independently edited source.
- Contracts owns methods, paths, operation IDs, tags, parameter/body/response/error
  schemas, statuses, security requirements and relevant headers/cookies. Its
  packages/tooling remain independent of Nest, Fastify, Express, Angular, Nx and
  either Bricks implementation.
- 3-tier, DDD and API clients consume versioned published or pinned immutable
  artifacts. Neither Bricks implementation defines the other's public API.
- Domain models, business invariants, runtime logic and internal application ports
  stay in their implementation domains. `auth-ts` retains transport-neutral policy
  semantics and evaluation conformance; Contracts owns their HTTP representation.
- Current `libs/*/ts` TypeBox DTOs/validators, Nest controllers, `@RouteSchema`,
  `tools/api-specs/route-metadata.ts` and `docs/openapi` are legacy implementation
  baseline material. Preserve working exports and behavior until audited adoption;
  do not treat them as a second independently evolving contract authority.

[Contracts epic #1](https://github.com/anarchitects/anarchitecture-contracts/issues/1)
provides extraction, releases and conformance tooling. Completed
[Contracts #2](https://github.com/anarchitects/anarchitecture-contracts/issues/2)
provides foundations only. [3-tier #485](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/485)
tracks adoption: #486 establishes these rules; #487 audits the baseline; later
children consume and verify available artifacts. Do not claim publication or
adoption from governance acceptance, or invent canonical package imports.

The [frozen #487 legacy API audit](/guides/public-api-legacy-baseline.html) records
immutable source evidence, real runtime checks and semantic discrepancies for
Contracts extraction. It is baseline evidence, not a second contract authority.

## Domain Contract Matrix

| Domain     | Current local TS package      | Angular consumer                   | Nest consumer                   |
| ---------- | ----------------------------- | ---------------------------------- | ------------------------------- |
| Forms      | `@anarchitects/forms-ts`      | `@anarchitects/forms-angular`      | `@anarchitects/forms-nest`      |
| Auth       | `@anarchitects/auth-ts`       | `@anarchitects/auth-angular`       | `@anarchitects/auth-nest`       |
| Identity   | `@anarchitects/identity-ts`   | `@anarchitects/identity-angular`   | `@anarchitects/identity-nest`   |
| Newsletter | `@anarchitects/newsletter-ts` | `@anarchitects/newsletter-angular` | `@anarchitects/newsletter-nest` |

These are existing local package names, not names of canonical contract packages.
All four domains' shared public HTTP authority belongs to Contracts. Each consumer
must record the immutable contract version and capabilities it actually verifies.
Missing DDD capabilities are unsupported, not assumed equivalent.

## Forms TS Contracts

Continue using `@anarchitects/forms-ts` public exports for current form definitions,
renderer models, dynamic validation and transitional submission DTOs. Forms owns
configurable intake; typed business operations belong to their domains. Separating
public wire definitions from internal form models must not move domain logic into
Contracts or change field-validation/error semantics incidentally.

## Auth TS Contracts

Continue using `@anarchitects/auth-ts` public exports for current lifecycle DTOs,
profiles and shared auth models. Its policy vocabulary and evaluation semantics
remain local under ADR-0014. Canonical HTTP policy schemas must map without loss to
that model. Do not expose Better Auth internals, change session-first behavior or
replace authentication/authorization providers as part of contract extraction.

## Consumer Mapping (Angular and Nest)

- Angular maps transport in `data-access` and state orchestration in `state`, keeping
  UI/feature APIs stable and state explicitly provided. Generated clients must
  eventually consume the same pinned canonical version as the verified backend.
- Nest preserves `presentation -> application <- infrastructure`, facade/advanced
  exports and typed configuration. Framework request/reply types, raw-body capture,
  cookies, validation and serialization bindings stay in presentation/integration.
- During transition, controllers import existing TS DTO schemas; `@RouteSchema`
  contains only `body`, `params`, `querystring`, `headers` and `response`. Keep
  operation ID/tag mappings in `tools/api-specs/route-metadata.ts` until parity is
  proven. A future TypeBox/Fastify adapter must consume or derive from canonical
  artifacts, never introduce independently authored Zod and TypeBox definitions.

## Contract Change Workflow

1. Read all Meta/local ADRs, relevant guides and the applicable canonical contract
   version and compatibility rules. If required artifacts are unavailable, report
   the dependency and limit work to authorized governance/audit scope.
2. Freeze and audit source revisions, TypeBox DTOs/validators, controller metadata,
   generated OpenAPI, Angular usage and actual HTTP behavior. Classify discrepancies;
   neither the generator nor the current runtime alone proves the intended contract.
3. Coordinate canonical Zod schema/operation authoring and review in Contracts.
   Preserve the audited wire behavior or obtain an explicit versioned breaking-change
   migration. Review coercion, defaults, optional/null fields, unknown keys,
   refinements, serialization, error/status and header semantics.
4. After immutable artifacts are available, pin the chosen version and implement
   local compatibility bindings. Verify Nest 12 Standard Schema against exact
   versions; preserve Nest 11 patch-only support without feature backports.
5. Regenerate local OpenAPI and compare with canonical OpenAPI 3.1, then verify real
   HTTP, Angular/generated clients, public exports and clean packed consumers.
   Keep the working generator and baseline tests throughout the transition.
6. Retire redundant local operation/schema authoring only after conformance is
   proven. Publish a capability/version support matrix and reviewed migration/release
   evidence. Complete 3-tier and claimed-capability DDD adoption before separate
   Nest 12-native modernization; each child issue has its own reviewed PR.

## Compatibility Rules

- Existing public exports and runtime behavior remain supported until explicitly
  reviewed migration/release changes. A local OpenAPI snapshot is not API approval.
- Contract packages have an independent domain-scoped SemVer lifecycle. Coordinate
  breaking wire migrations with consumers; do not assume an additive schema change
  is semantically compatible without review.
- Preserve auth/passkeys, JWT, cookie/session headers, authorization denials,
  Newsletter exact signed webhook bytes, rate limits and `Retry-After`, Forms field
  validation and Identity request/response behavior.
- Domain package restructuring, adapter selection and provider modernization are
  separate changes; contract extraction must not silently perform them.
- Human review, commit/PR ownership and CI release gates remain mandatory. This
  governance step performs no runtime migration, release or npm deprecation.

## Verification Checklist

- Canonical contract version, compatibility decision and frozen baseline are linked.
- Implementation OpenAPI is compared against the pinned canonical version; no manual
  edits to `docs/openapi`, and no lost operation IDs, tags, schemas or responses.
- Positive, negative and security HTTP tests cover supported routes, parameters,
  errors/statuses, authentication/authorization, headers/cookies and serialization.
  Schema diffs and Prism mocks alone do not prove conformance.
- Angular/client output and clean packed consumers verify declared dependency,
  runtime/module-format and capability/version support; unsupported capabilities
  are explicit. These are adoption gates, not checks already delivered by #486.
- Docs refreshed and validated:
  `yarn nx run docs-hub:validate-content`,
  `yarn nx run docs-hub:build`,
  `yarn nx run docs-hub:verify`.

## Newsletter integration

See [Newsletter integration](/guides/newsletter-integration.html) for current provider
examples, Forms-backed signup, implementation OpenAPI and browser/database
regression. The [migration guide](/guides/newsletter-migration.html) separates
reusable capabilities from host policy and app-local data migration.
