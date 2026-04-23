# ADR-0001: Align With `anarchitecture-bricks-ddd` And Support Migration

- Status: Accepted
- Date: 2026-04-23
- Owners: Architecture maintainers
- Context: `anarchitecture-bricks-3tier` and `anarchitecture-bricks-ddd` are companion repositories with different internal architectural styles

## Context

This repository and `anarchitecture-bricks-ddd` are intended to evolve as companion repositories.

They should not become literal copies of one another, but they also must not drift into unrelated products.

We need an explicit decision that:

- defines the relationship between the 3-tier and DDD repos
- clarifies what should align between them
- treats migration from 3-tier to DDD as a supported evolution path

## Decision

### Companion repo posture

`anarchitecture-bricks-3tier` and `anarchitecture-bricks-ddd` are companion repositories.

They should align on:

- bounded-context/domain intent
- public capability surface by domain
- contract ownership and domain language
- example-app use cases where practical

They may differ on:

- internal package structure
- internal layering granularity
- explicitness of ports/adapters and DDD boundaries

### Architectural distinction

This repository remains the 3-tier companion implementation style.

The DDD repo remains the DDD/hexagonal companion implementation style.

Neither repo is a mere copy of the other.

### Migration posture

Migration from 3-tier to DDD is a supported path.

That migration should preserve domain meaning and public capability while translating structure from:

- shared `ts`
- domain-level Angular package
- domain-level Nest package

into the more explicit DDD package families.

## Consequences

### Positive

- cross-repo drift becomes easier to detect
- the two repos can evolve coherently without forced sameness
- migration to DDD becomes part of the documented architecture story
- maintainers get a clear mapping model between the repos

### Trade-offs

- maintainers must document intentional divergence explicitly
- some domains may need structural translation rather than direct copy/move operations
- cross-repo parity requires ongoing discipline

## Rules Derived From This Decision

1. New or changed domains in this repo should consider their counterpart in `anarchitecture-bricks-ddd`.
2. Capability alignment matters more than path-level sameness.
3. Migration to DDD should separate business meaning from transport/contracts and split frontend/backend responsibilities more explicitly.
4. Silent conceptual drift between the repos is not acceptable.

## Related

- [Guide: Alignment With `anarchitecture-bricks-ddd`](../guides/alignment-with-bricks-ddd.md)
- [Guide: Migration To `anarchitecture-bricks-ddd`](../guides/migration-to-bricks-ddd.md)
