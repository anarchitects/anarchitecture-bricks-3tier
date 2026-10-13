# ADR-0016: Consume Canonical Public API Contracts

- Status: Accepted
- Date: 2026-10-13
- Owners: Architecture maintainers
- Scope: [#486](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/486), the governance step of [epic #485](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/485)
- Governing decision: [Accepted Meta ADR-0012](https://github.com/anarchitects/anarchitecture-meta/blob/main/adr/0012-canonical-public-api-contract-ownership.md), introduced by [Meta PR #23](https://github.com/anarchitects/anarchitecture-meta/pull/23), merged 2026-10-12

## Context

The current 3-tier implementation shares TypeBox DTOs through `libs/*/ts`, binds
Fastify schemas in Nest controllers, assigns operation IDs and tags in
`tools/api-specs/route-metadata.ts`, and generates `docs/openapi`. These are useful
baseline artifacts, but cannot make 3-tier the contract authority for DDD or other
consumers. Meta has assigned that authority to `anarchitecture-contracts`.

[Contracts epic #1](https://github.com/anarchitects/anarchitecture-contracts/issues/1)
tracks extraction, publication and adoption. Its completed
[foundation issue #2](https://github.com/anarchitects/anarchitecture-contracts/issues/2)
establishes governance and release foundations, not extracted contracts, published
packages or verified consumer adoption. This local decision can precede package availability.

## Decision

1. **Canonical ownership:** `anarchitecture-contracts` is the sole source of shared
   public HTTP wire contracts for Auth, Forms, Identity and Newsletter. Canonical
   authoring consists of Zod-first transport schemas and first-class operation
   definitions: methods, paths, operation IDs, tags, parameters, bodies, responses,
   errors, statuses, security requirements and relevant headers/cookies.
   Deterministically generated OpenAPI 3.1 JSON/YAML is an authoritative published
   artifact of those sources, never a separately authored specification.
2. **Dependency direction:** 3-tier, DDD and Angular/API consumers adopt published
   versioned or pinned immutable contract artifacts independently. Contracts must
   have no runtime dependency on Nest, Fastify, Express, Angular, Nx or either
   Bricks implementation. Do not copy local schemas into a second canonical set,
   require DDD to consume 3-tier output, or invent package names/versions before publication.
3. **Retained ownership:** domain models, business invariants, runtime behavior and
   internal application ports remain in their implementation domains. `auth-ts`
   retains transport-neutral authorization-policy semantics and evaluation
   conformance under ADR-0014. Contracts owns the HTTP representation of policies;
   mappings must preserve meaning without lossy or independently authored duplication.
4. **Transition:** preserve existing TypeBox DTO exports, validators, controllers,
   Fastify behavior, `@RouteSchema`, `route-metadata.ts`, generated OpenAPI and tests
   as implementation-local baseline material. Inventory their actual behavior and
   classify drift before semantically migrating to Zod. Local spec regeneration or
   a snapshot update never authorizes a shared public API change. Do not manually
   edit `docs/openapi` or remove the working generator before conformance is proven.
5. **Presentation and schema integration:** preserve
   `presentation -> application <- infrastructure`, root facades and advanced
   entry points. Framework request/reply types, cookies, raw-body capture and
   validation bindings stay in explicit presentation/integration adapters. A
   temporary TypeBox/Fastify bridge belongs here and must consume or derive from
   canonical contracts. Do not maintain independent Zod and TypeBox definitions.
   Verify Nest 12 Standard Schema integration against exact supported versions;
   no adapter default or runtime migration follows from this ADR.
6. **Compatibility:** preserve current wire behavior unless an approved contract
   version migration explicitly changes it. Semantic review must cover coercion,
   defaults, unknown fields, optional/null values, refinements, serialization and
   error shapes, not just inferred TypeScript types. Protect auth/passkeys, JWT,
   session/cookie headers, policy denials, Newsletter signed bytes and rate limits,
   Forms field validation, and Identity parameter/body validation.
7. **Evidence and retirement:** compare implementation-generated output to the
   pinned canonical OpenAPI and exercise positive, negative and security cases over
   real HTTP. Verify packed consumers, runtime manifests and Angular/client output.
   Publish support by capability and exact contract version; missing DDD capabilities
   remain explicitly unsupported. Remove redundant local operation/schema authoring
   only after parity and replacement checks pass. Schema comparison alone is insufficient.
8. **Sequence and releases:** establish the frozen baseline, canonical Zod schemas
   and operations, immutable releases and conformance tooling, then complete 3-tier
   and claimed-capability DDD adoption before separate Nest 12-native modernization.
   Nest 11 remains patch-only for security/bug fixes; no feature backports follow
   from extraction. Preserve existing compatibility commitments, SemVer review,
   human acceptance and CI-owned publication. Each #485 child has a separate reviewed PR.
9. **Contributor preflight:** read all Meta/local ADRs and relevant guides, then the
   applicable canonical contract version and compatibility rules before public API
   work. If required artifacts are unavailable, report the dependency and continue
   only authorized governance/audit work; do not create a substitute contract authority.

## Relationship to earlier decisions

This decision resolves the ownership deferral in local ADR-0012 decision 1 and
ADR-0015 decision 2. Their Fastify preservation, Zod migration and evidence gates
remain binding. It supersedes only the public HTTP authority implied by ADR 106's
`auth-ts` DTO source-of-truth language and ADR-0010's local TS route-schema/metadata
ownership: those describe the transitional implementation. Domain ownership,
provider containment, internal policy semantics and existing exports remain intact.

Meta ADR-0010 and local ADR-0013–0015 establish Nest 11 patch-only maintenance,
superseding ADR-0011's earlier permission for Nest 11 feature work. ADR-0011's
packed-consumer and compatibility obligations still apply. Accepted future Nest
targets do not establish shipped support; the proposed Newsletter amendment and
unrelated Meta governance proposals retain their recorded status.

## Consequences and delivery boundary

Public contract changes require review and versioning in Contracts before consumer
adoption. Local OpenAPI remains useful implementation-derived conformance evidence.
There is no runtime, dependency, package-export, release or deprecation change in
#486. Governance acceptance does not claim the audit, extraction, publication,
consumer migration or epic closure is complete.

Follow-on work is [#487](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/487)
(baseline audit), then the remaining #485 children for adoption and conformance.
See the [TS Contracts Guide](../guides/ts-contracts.md) for the contributor workflow.
