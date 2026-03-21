# AI Agents Guide

## Intent

This guide defines repository-specific overlays that AI coding agents can follow when building with Anarchitecture Bricks packages. The overlays are independent of Nx-managed agent content.

## Applicability (Nx and non-Nx)

These overlays are valid in:

- Nx workspaces
- non-Nx repositories that consume Bricks packages

The guidance is package-focused and applies whenever libraries from `@anarchitects/*` are used.

## README-First Enforcement Overlay

Use this overlay in every agent instruction file that consumes Bricks packages:

```md
## Bricks README-First Overlay (Required)

- Before generating code, identify every `@anarchitects/*` package involved and read each package README end-to-end.
- Treat package READMEs as the primary source of integration truth (entry points, provider setup, expected composition, and constraints).
- Do not guess imports, module wiring, or runtime behavior when README guidance exists.
- If README guidance and local app code differ, align with README contracts unless a host override is explicitly documented.
- In generated code comments/PR notes, cite which package README sections drove decisions.
```

## Bricks Core Overlay

Use this overlay for general package usage and architecture boundaries:

### AGENTS.md overlay block

```md
## Anarchitecture Bricks Overlay

- Apply the Bricks README-First Overlay first.
- Prioritize public package contracts from `@anarchitects/*` and avoid internal path imports.
- Keep Angular layering strict: `ui <- feature -> state -> data-access` with `config` and `util` shared.
- Keep Nest layering strict: `presentation -> application <- infrastructure` with `config` and `util` shared.
- Favor root facade entry points for quick starts, then use secondary entry points for advanced composition.
- Keep OpenAPI/Storybook/docs generation flows aligned with package changes.
```

## Angular Packages Overlay

Use this overlay when working with Angular package consumption (`@anarchitects/*-angular`):

```md
## Angular Packages Overlay

- Apply the Bricks README-First Overlay first for every `@anarchitects/*-angular` package you import.
- Compose features using published Angular packages such as `@anarchitects/forms-angular` and `@anarchitects/auth-angular`.
- Keep state explicit via provider helpers; avoid implicit global singletons for domain stores.
- Use generated or typed domain contracts from `@anarchitects/*` TS libraries for request/response boundaries.
- Keep presentational concerns in UI packages and orchestration in feature/state layers.
```

## Nest Packages Overlay

Use this overlay when working with Nest package consumption (`@anarchitects/*-nest`):

```md
## Nest Packages Overlay

- Apply the Bricks README-First Overlay first for every `@anarchitects/*-nest` package you import.
- Start with facade modules from packages such as `@anarchitects/forms-nest` or `@anarchitects/auth-nest`.
- Use secondary entry points only when explicit overrides are needed.
- Keep route schemas sourced from shared DTO packages and avoid inline schema drift.
- Preserve infrastructure boundaries and keep cross-domain persistence relations scalar at runtime.
```

## Release Safety Overlay

Use this overlay to keep docs/package workflow safe:

```md
## Release Safety Overlay

- Do not introduce version bumps as part of docs-only work.
- For docs-surface changes, keep commit types non-bumping (`docs`, `chore`, `ci`, `style`).
- Avoid `feat`, `fix`, `refactor`, `perf`, `revert`, `!`, or `BREAKING CHANGE` in docs-only PR commit subjects.
```

## Placement Patterns

Use these copy/paste patterns for each target agent file.

### AGENTS.md

```md
## Anarchitecture Bricks Overlay

- Paste Bricks README-First Overlay at the top (required).
- Paste the Bricks Core Overlay.
- Paste Angular Packages Overlay and/or Nest Packages Overlay depending on the host app stack.
- Paste Release Safety Overlay.
```

### CLAUDE.md

```md
## Claude Bricks Overlay

- Apply Bricks README-First Overlay before any code generation.
- Follow the same Bricks Core, Angular/Nest, and Release Safety overlays used in `AGENTS.md`.
- Keep responses aligned with published contracts from `@anarchitects/*`.
```

### GEMINI.md

```md
## Gemini Bricks Overlay

- Apply Bricks README-First Overlay before any code generation.
- Follow the same Bricks Core, Angular/Nest, and Release Safety overlays used in `AGENTS.md`.
- Favor package-level composition guidance over repository-internal assumptions.
```

### .github/copilot-instructions.md

```md
## Copilot Bricks Overlay

- Apply Bricks README-First Overlay before any code generation.
- Apply Bricks overlays from `AGENTS.md` for package usage decisions.
- Keep guidance scoped to published packages and architecture boundaries in `@anarchitects/*`.
```

If an Nx-managed block already exists in an agent file, append these Bricks overlays below that block.  
If no Nx-managed block exists (or the repo is non-Nx), paste these overlays directly into the target agent file.
