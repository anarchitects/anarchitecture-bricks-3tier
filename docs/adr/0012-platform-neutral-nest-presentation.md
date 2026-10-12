# ADR-0012: Evolve Nest Presentation Toward HTTP Platform Neutrality

- Status: Accepted
- Date: 2026-10-12
- Owners: Architecture maintainers
- Scope: 3-tier Nest Bricks and their HTTP/published-contract generation

## Context

The Nest 11/12 compatibility effort in [ADR-0011](0011-verify-nest-runtime-support-independently-of-tooling.md) concerns framework majors, not HTTP-platform compatibility. The current presentation controllers use Fastify `@RouteSchema` and some `@RouteConfig`, while Auth rewrites `FASTIFY_ROUTE_SCHEMA_METADATA` directly. Newsletter explicitly uses `FastifyRequest` / `FastifyReply`, `validationError`, reply headers and raw-body webhooks. OpenAPI is generated from Fastify route metadata and domain TS TypeBox schemas. A change of Nest adapter could leave routes operational but silently drop runtime validation/serialization or security.

The [ecosystem HTTP-independence ADR](https://github.com/anarchitects/anarchitecture-meta/blob/main/adr/0008-http-platform-independence.md) establishes the target boundary; this ADR scopes this repository's implementation direction.

## Decision

1. Keep `libs/*/ts` the canonical owner of DTOs, TypeBox/JSON Schema contracts and domain models; do not duplicate shapes in HTTP adapters, Nest decorators or OpenAPI generation.
2. Keep `presentation -> application <- infrastructure` and the public facade/advanced entry point model. Framework-specific request/reply and lifecycle operations belong in explicit Nest presentation/integration seams, never application services or domain contracts.
3. Treat existing Fastify `@RouteSchema`, `@RouteConfig`, direct metadata reflection and request/reply types as **Fastify-specific compatibility mechanisms**, not adapter-neutral public contracts. Preserve Fastify behavior during refactoring; do not delete schema metadata until equivalent validation, serialization and OpenAPI have been demonstrated.
4. Investigate Nest 12 Standard Schema validation/serialization and TypeBox integration, including appropriate adapters/conversion and compatibility with Nest 11. TypeBox JSON Schema by itself does not prove Standard Schema compliance. A migration must preserve validation semantics and status codes, response serialization, path/query/header semantics, and implementation-derived OpenAPI without introducing separate DTO truth.
5. Introduce targeted framework-neutral request/response ports where needed (e.g. client key extraction, rate-limit response headers, cookies, forwarded-header trust, raw signed body) and platform implementations. Preserve authentication, Better Auth/passkeys, CASL guards, newsletter rate limiting and webhook signature verification fail-closed.
6. Keep the existing Fastify OpenAPI generator and testing as baseline. Prove any new adapter with actual compiled, packed clean-consumer installs, HTTP requests and contract snapshot/spec diffs; an HTTP backend simply booting is insufficient. Respect [ADR-0011](0011-verify-nest-runtime-support-independently-of-tooling.md) and versioned Nest 11/12 support lines.
7. Do not change current defaults, peer dependencies, runtime behavior, or public support claims merely by accepting this proposal. Additional adapters and any breaking migration require separate implementation work, evidence and release decisions.

## Validation gates

- Tests per relevant brick: Forms/Identity body/path/query validation and serialization; Auth authentication/authorization, passkey cookies and headers; Newsletter subscription/native actions, webhook exact signed bytes, raw body, rate limiting/Retry-After and client key extraction; shared mailer host integration.
- OpenAPI generation and verification against existing route-contract schemas; no lost `operationId`, tags or response definitions.
- Explicit supported-adapter x Nest-major x runtime/ESM/CJS matrix and declaration checks with packed artifacts.
- Representative negative/security cases: malformed requests, missing signatures, invalid forwarded headers, excessive bodies, and denied policies must remain rejected.
- Fail fast or restrict compatibility whenever feature parity cannot be guaranteed.

## Consequences

- Fastify-specific runtime coupling becomes visible instead of an implicit foundation.
- Contract preservation may require phased dual-path support or versioned majors/minors.
- Fastify remains the supported starting point until proven alternatives are released.

## References

- [Meta candidate Node default](https://github.com/anarchitects/anarchitecture-meta/blob/main/adr/0009-native-node-candidate-default.md)
- [Nest compatibility epic #461](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/461)
- [Newsletter epic #428](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/428)
