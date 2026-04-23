# Alignment With `anarchitecture-bricks-ddd`

- Status: Active guide
- Audience: Maintainers and contributors of `anarchitecture-bricks-3tier`
- Scope: Cross-repo alignment with `anarchitects/anarchitecture-bricks-ddd`

## Purpose

`anarchitecture-bricks-3tier` and `anarchitecture-bricks-ddd` are companion repositories.

They must **sensibly mirror each other** at the bounded-context and capability level, while **not** becoming literal copies of one another.

The goal is:

- the same business capabilities and domain areas remain recognizable across both repos
- the 3-tier repo provides the 3-tier implementation style
- the DDD repo provides the DDD/hexagonal implementation style
- migration from 3-tier to DDD remains practical, incremental, and well-documented

## Core Position

The two repos should align on:

- bounded-context names and intent where possible
- public capability surface by domain
- contract ownership and domain language
- example-app scenarios used to validate the libraries
- documentation of how one style maps to the other

The two repos should differ in:

- internal architecture style
- internal layering granularity
- how responsibilities are packaged
- how domain and contract boundaries are represented internally

## What “Aligned” Means

Alignment does **not** mean that every library path, class name, or entry point is identical.

Alignment means that a maintainer can answer these questions clearly across both repos:

1. Which bounded context in 3-tier corresponds to which bounded context in DDD?
2. Which public capabilities are intentionally equivalent?
3. How does a 3-tier implementation map to the more explicit DDD structure?
4. What is the migration path if a domain should move from 3-tier packaging to DDD packaging?

## Repository Relationship

### `anarchitecture-bricks-3tier`

This repo is the companion implementation style for:

- reusable libraries organized in a simpler 3-tier structure
- TypeScript shared schemas/models in `libs/<domain>/ts`
- Angular and Nest deliverables organized per domain without the full DDD package split

### `anarchitecture-bricks-ddd`

The DDD repo is the companion implementation style for:

- reusable libraries organized by bounded context, technology family, and explicit layer
- shared TS core split into `ts/domain` and `ts/contracts`
- more explicit ports/adapters and application-layer boundaries

## Canonical Mapping Model

Use this mapping model when documenting or implementing equivalent capabilities.

### Shared TS

3-tier:

- `libs/<domain>/ts`

DDD:

- `libs/<context>/ts/domain`
- `libs/<context>/ts/contracts`

Interpretation:

- the 3-tier TS library often contains concerns that the DDD repo splits into domain and contract packages
- migration should separate business meaning from transport/public schemas intentionally

### Nest

3-tier:

- `libs/<domain>/nest`

DDD:

- `libs/<context>/nest/application`
- `libs/<context>/nest/presentation`
- `libs/<context>/nest/infrastructure-*`
- `libs/<context>/nest/facade`

Interpretation:

- the 3-tier Nest package corresponds to multiple DDD Nest layer packages
- the DDD repo makes ports, adapters, and composition roots more explicit

### Angular

3-tier:

- `libs/<domain>/angular`

DDD:

- `libs/<context>/angular/ui`
- `libs/<context>/angular/feature`
- `libs/<context>/angular/state`
- `libs/<context>/angular/data-access`
- `libs/<context>/angular/facade`

Interpretation:

- the 3-tier Angular package corresponds to multiple explicit frontend layers in the DDD repo
- both repos should still align on the same frontend capability surface per domain

## Alignment Rules

### 1. Keep bounded-context/domain names intentionally close

If a capability exists in one repo, the corresponding capability in the other repo should use the same or clearly traceable naming.

### 2. Keep public language aligned

DTO names, public concepts, and package-level terminology should not drift casually between repos.

### 3. Keep examples comparable

If `auth` or `forms` exists in both repos, the example applications should validate comparable use cases, even if the internal implementation style differs.

### 4. Do not force artificial sameness

The DDD repo is allowed to be more explicit and more granular. The 3-tier repo is allowed to remain simpler. Alignment should preserve intent, not erase the difference in architectural style.

### 5. Document drift explicitly

If one repo intentionally moves ahead of the other for a domain or capability, document the divergence instead of letting it become silent drift.

## Preferred Evolution Pattern

When a domain starts in 3-tier but needs stronger domain boundaries, the preferred path is:

1. preserve the domain name and public intent
2. identify business meaning vs transport/schema concerns in `libs/<domain>/ts`
3. map Nest concerns into application, presentation, infrastructure, and facade responsibilities
4. map Angular concerns into `ui`, `feature`, `state`, `data-access`, and `facade`
5. document the migration in both repos

## Anti-Patterns

Avoid the following:

- letting the same domain mean different things in the two repos
- copying files mechanically from one repo to the other without architectural translation
- treating the DDD repo as merely a renamed 3-tier repo
- treating the 3-tier repo as obsolete or architecturally invalid by default
- introducing new domains in one repo without at least documenting the expected counterpart in the other

## Checklist

Before adding or changing a domain in this repo, verify:

1. Does the corresponding domain or bounded context exist in `anarchitecture-bricks-ddd`?
2. If yes, is the intent still aligned?
3. If no, should a counterpart be created later, or is the divergence intentional?
4. If this change would complicate future migration to DDD, is that trade-off acceptable and documented?

## Related

- [Guide: Migration To `anarchitecture-bricks-ddd`](./migration-to-bricks-ddd.md)
