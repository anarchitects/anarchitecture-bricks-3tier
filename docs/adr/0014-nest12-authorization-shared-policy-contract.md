# ADR-0014: Native Nest Authorization with Canonical Auth-TS Policies

- Status: Accepted
- Date: 2026-10-12
- Owners: Architecture maintainers
- Governing: [Meta Nest-first ADR](https://github.com/anarchitects/anarchitecture-meta/blob/main/adr/0010-nest-first-runtime-and-dependency-policy.md)

## Decision — B2

1. Use `@nestjs/authorization` as the target **server authorization** framework for Nest 12. Keep explicit deny-by-default and server-side enforcement. Nest-specific decorators and guards remain in Nest presentation, not shared TS contracts.
2. Define a single, versioned, serializable policy vocabulary in `@anarchitects/auth-ts`: actions, subjects, conditions/expressions, field access, allow/deny semantics and explicit precedence/evaluation. The TS package must not import Nest, CASL or framework-specific metadata.
3. Maintain CASL as a _client-side_ Angular policy evaluator through an adapter, for rendering and UX only. Client checks are never a security control.
4. Implement a strict `auth-ts` to Nest policy mapping and `auth-ts` to CASL mapping. For incompatible CASL Mongo conditions, field rules, subject detection, wildcards or deny precedence, either design a lossless shared subset with versioning or fail closed. No silent fallback to allow; do not assume native Nest and CASL are feature-equivalent.
5. Generate a shared policy conformance suite from `auth-ts` fixtures exercised independently on the Nest and Angular sides, including hostile cases and field/conditional/deny rules. Protect persistence migrations of currently saved policy JSON.
6. Remove `@casl/ability` from the server package only after demonstrable parity for current `PoliciesService`, `AbilityFactory`, `ResourceAuthorizationService`, route policies and persisted rules. Preserve backward-compatible Angular/TS contracts or explicitly version the breaking changes.
7. New authorization features are Nest 12 only. Nest 11 receives patch maintenance only, subject to separately maintained release lines.

## Consequences

- Shared policy semantics remain Anarchitects-owned; Nest and CASL are replaceable evaluators.
- Cross-evaluator conformance tests become mandatory security regression tests.
- Existing CASL support is preserved during migration and cannot be deleted simply because native guards exist.
