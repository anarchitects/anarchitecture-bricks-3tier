---
name: bricks-3tier-implementation
description: implement and refactor code in anarchitecture-bricks-3tier. use when work belongs specifically in the 3-tier bricks repo, especially for shared ts libraries, domain-level angular packages, domain-level nest packages, facade composition, openapi or compodoc or storybook documentation, and keeping the repo aligned with its ddd companion while preserving the 3-tier implementation style.
---

# Overview
Use this skill when the task belongs in `anarchitecture-bricks-3tier`.

Before changing code, inspect these repo files when relevant:

- `AGENTS.md`
- `README.md`
- domain package `README.md` files
- `docs/guides/alignment-with-bricks-ddd.md`
- `docs/guides/migration-to-bricks-ddd.md`
- `docs/adr/0002-do-not-split-libraries-by-audience-until-workflow-divergence-is-real.md`

## Core implementation rules
- Keep shared schemas, dto definitions, builders, and typed models in `libs/*/ts`.
- Preserve the repo layering rules:
  - Angular: `ui <- feature -> state -> data-access`
  - Nest: `presentation -> application <- infrastructure`
- Prefer root facade modules for easy mode, but preserve advanced subpath entry points.
- Keep examples as validation surfaces, not product packages.
- Do not create or modify anything under `apps/`.
- Do not manually edit generated OpenAPI artifacts under `docs/openapi/`.
- Do not split libraries by audience (`admin`, `public`, `backoffice`, etc.) as a default rule; package by capability first and introduce audience-specific libraries only when workflow divergence is real.
- If the difference is mainly route location, route guard, layout shell, or host-app composition, keep the reusable capability in the domain library and let the consuming app compose the audience-specific page.

## Required workflow
1. Identify the target domain under `libs/<domain>`.
2. Read the repo-level and package-level docs that govern the change.
3. Implement the smallest change that satisfies the request while preserving the 3-tier style.
4. Run or propose the correct Nx validation commands using the package-manager-prefixed form.
5. In the final summary, call out whether the change affects cross-repo alignment with `anarchitecture-bricks-ddd`.

## Nest-specific guidance
- Keep route schemas imported from domain TS dto libraries.
- Keep controller metadata compatible with OpenAPI generation.
- Keep infrastructure wrappers thin and adapter-focused.
- Preserve dual setup conventions such as `forRoot(...)` and `forRootFromConfig(...)` when they already exist.

## Angular-specific guidance
- Keep state intentionally scoped.
- Do not introduce implicit root-scoped domain state.
- Keep presentational concerns in `ui`, smart orchestration in `feature`, state in `state`, and transport in `data-access`.
- Treat audience and access policy as composition concerns unless the admin or staff surface has become a genuinely different workflow.

## Cross-repo alignment check
When the change affects domain meaning, public capability, package naming, or migration expectations, also inspect:

- `docs/guides/alignment-with-bricks-ddd.md`
- `docs/guides/migration-to-bricks-ddd.md`
- `docs/adr/0001-align-with-bricks-ddd-and-support-migration.md`
- `docs/adr/0002-do-not-split-libraries-by-audience-until-workflow-divergence-is-real.md`

If the requested change would make future migration to the DDD repo harder, say so explicitly.
