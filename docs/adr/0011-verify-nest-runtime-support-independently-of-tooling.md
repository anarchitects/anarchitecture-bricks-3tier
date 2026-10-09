# ADR-0011: Verify Nest Runtime Support Independently Of Tooling

- Status: Accepted
- Date: 2026-10-09
- Acceptance: Explicit maintainer approval on 2026-10-09.
- Owners: Architecture maintainers
- Scope: [epic #461](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/461), starting with [#462](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/462)

## Context

Six publishable packages currently declare Nest 11 peers. Nest 12 is published,
but compatible upstream peer metadata alone cannot establish brick support.
The [compatibility audit](../guides/nest-11-12-compatibility-audit.md) records
exact versions, consumers, integration constraints and outstanding checks.

The workspace's `@nx/nest` excludes Nest 12. The available
`@anarchitects/nest@0.0.3` supports Nest 12 tooling only and has higher Node
requirements than the runtime bricks. Conflating these contracts would either
block new tooling unnecessarily or remove Nest 11 consumer support without proof.
An ADR is warranted because this distinction governs every package and the
subsequent workspace, CI and release issues.

## Decision

1. Treat workspace tooling compatibility and published runtime compatibility as
   separate contracts. Evaluate `@anarchitects/nest` adoption in #463, preserving
   compiled package exports. Never require Nx or the plugin in runtime consumers.
2. Preserve Nest 11 while investigating Nest 12 per package. No blanket
   Nest-12-only decision follows from the plugin's supported framework major.
   Keep each consuming host's common/core/platform/testing major aligned.
3. Publish support only after clean consumers install packed artifacts and pass
   declaration, module-loading and meaningful runtime tests for the dependency
   combinations being advertised. Include the facade and advanced entry points,
   explicit/config-driven initialization, optional integrations and actual
   HTTP/persistence/mail behavior where applicable.
4. Preserve existing module formats where feasible. ESM upstream dependencies
   are a test requirement, not sufficient grounds to remove CommonJS consumers.
   Test runtime Node minimums separately from compiler/generator requirements.
5. Keep source, built and packed manifests consistent for all six packages.
   Protect intentional peer unions from root-range normalization. Release
   validation must check the same compatibility contract as consumer CI.
6. If dual support fails, document a concrete blocker and migration alternative
   per package before changing support. A dropped supported Nest/Node version or
   removed export is a breaking change requiring human acceptance and an explicit
   release decision. Retain the prior Nest 11 release line rather than retroactively
   claiming it supports Nest 12. Do not deprecate packages without separate approval.
7. Respect one PR per child issue and human review/merge sequencing. Newsletter
   publication remains subject to #428's coordinated release gate; implementation
   or matrix success does not authorize publication.

## Consequences

- A Nest 12 tooling workspace may validate Nest 11 bricks in separate consumer
  hosts. Until root migration is practical, a Nest 11 workspace may validate a
  separate Nest 12 candidate without forcing incompatible root peers.
- Tests and dependency fixtures become more explicit. Workspace-only builds,
  copied artifacts with symlinked dependencies and permissive peer declarations
  remain useful checks but cannot replace clean installation evidence.
- Package support can differ when justified. Public documentation must list those
  differences and distinguish intended, upstream-admitted and verified support.
- This ADR and audit change no runtime dependency or public API. Nest 12 support
  is not established by accepting this decision; #464–#468 supply that evidence.

## Alternatives considered

- **Widen every Nest peer immediately:** rejected because it bypasses integration,
  loading and behavior verification.
- **Drop Nest 11 to match the new plugin:** rejected without package-specific
  evidence; tooling ownership does not determine a reusable runtime contract.
- **Keep Nest 11 indefinitely because @nx/nest excludes 12:** rejected as a policy;
  `@anarchitects/nest` and isolated runtime fixtures provide paths to evaluate.
- **Convert all bricks to ESM first:** deferred; preserve existing consumption paths
  unless actual loading or API evidence requires a breaking format change.
