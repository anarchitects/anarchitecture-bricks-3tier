# Design/UI Systems Guide

## Intent

This guide defines the cross-stack design and UI system model for Anarchitecture Bricks. It explains how to consume `@anarchitects/*` packages so design contracts, composition APIs, and runtime layouts stay consistent across domains and applications.

Contract ownership for DTOs and domain models is defined in the canonical [TS Contracts Guide](/guides/ts-contracts.html).

## System Layers

The UI system is layered and should be adopted in order:

1. `@anarchitects/common-angular-design`
2. `@anarchitects/common-angular-ui-composition`
3. `@anarchitects/common-angular-ui-primitives`
4. `@anarchitects/common-angular-ui-layouts`
5. Domain UI slices (`@anarchitects/forms-angular/ui`, `@anarchitects/auth-angular/ui`)

Domain orchestration should still follow Angular layering:
`ui <- feature -> state -> data-access`.

Backend support should still follow Nest layering:
`presentation -> application <- infrastructure`.

## Token and Theme Model

Use token and theme contracts from `@anarchitects/common-angular-design` as the primary extension mechanism:

- Keep shared packages unbranded.
- Apply product branding via token overrides and theme contexts.
- Use semantic hooks (`data-anx-theme`, `data-anx-density`, `data-anx-surface`, `data-anx-layout`) to scope behavior.

Example:

```css
.anx-root[data-anx-theme='brand-a'] {
  --anx-sys-color-primary: #0f766e;
  --anx-sys-color-accent: #0ea5e9;
  --anx-layout-content-max-width: 72rem;
}
```

## Single-Source Theme Setup

Use one canonical app-bootstrap path for shared design context:

1. Apply base styles once before rendering.
2. Register `provideDesignSystemConfig(...)` at app root.
3. Avoid manual `data-anx-theme`, `data-anx-density`, and `data-anx-surface`
   on the root in new setups.

Example:

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideDesignSystemConfig } from '@anarchitects/common-angular-design/config';
import { applyAnxBaseStyles } from '@anarchitects/common-angular-design/styles';

applyAnxBaseStyles();

bootstrapApplication(AppComponent, {
  providers: [
    ...provideDesignSystemConfig({
      theme: 'default',
      density: 'comfortable',
      surface: 'plain',
      layout: 'list',
      columns: 1,
    }),
  ],
});
```

The provider applies `anx-root`, `data-anx-theme`, `data-anx-density`, and
`data-anx-surface` on `document.documentElement` during bootstrap.

`data-anx-layout` and `data-anx-columns` remain explicit where local layout
scope is required.

For migrations from manual attributes, use the
[Theme Migration Guide](/guides/theme-migration.html).

### Precedence Rules

For managed root values (`theme`, `density`, `surface`) the resolution order is:

1. Directive input (`designTheme`, `designDensity`, `designSurface`)
2. Explicit host/root attribute value (`data-anx-*`)
3. Provider configuration (`provideDesignSystemConfig`)

This keeps migration safe because existing explicit attributes remain
authoritative.

## Composition Contracts

Use `@anarchitects/common-angular-ui-composition` for stable projection contracts:

- Canonical slots via `anxSlot="..."` as public API.
- Templates via `ng-template[anxTemplate]` for host customization.
- Alias compatibility only as migration support, not as new API surface.

Example:

```html
<anarchitects-ui-card>
  <h3 anxSlot="header">Summary</h3>
  <p anxSlot="content">Rendered with stable slot contracts.</p>
  <div anxSlot="footer">
    <button anxSlot="actions">Continue</button>
  </div>
</anarchitects-ui-card>
```

## Primitive Contracts

Use `@anarchitects/common-angular-ui-primitives` for reusable, non-domain visual building blocks:

- Keep primitive APIs token-driven and wrapper-friendly.
- Keep business decisions in feature/state layers.
- Extend via app wrappers instead of modifying shared primitive contracts.

## Layout Runtime Contracts

Use `@anarchitects/common-angular-ui-layouts` when runtime layout selection is required:

- Layout kinds: form, list, detail.
- Resolution precedence: host input, provider defaults, built-in fallback.
- Extend through provider APIs (`provideAnxLayouts`, `provideAnxLayoutDefaults`) instead of hardcoded branching.

## Domain Integration Matrix

| Domain Package                | Role                                     | Design/UI System Integration                                                     |
| ----------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------- |
| `@anarchitects/forms-angular` | Dynamic form/list/detail flows           | Consumes shared composition, primitives, and layout runtime contracts            |
| `@anarchitects/auth-angular`  | Auth feature orchestration and domain UI | Uses shared design tokens/primitives and contract-safe state composition         |
| `@anarchitects/forms-nest`    | Forms API/service backend                | Must preserve contract stability used by frontend layouts and form rendering     |
| `@anarchitects/auth-nest`     | Auth lifecycle backend                   | Must preserve contract stability used by frontend state/feature and policy flows |

## Cookbook Patterns

- Pattern: baseline app setup
  apply base styles first, then register provider config before rendering domain UI.
- Pattern: product theming
  apply token/theme overrides in app shell, not shared packages.
- Pattern: projection stability
  publish canonical slot/template names and avoid breaking renames.
- Pattern: backend-safe evolution
  update DTO contracts first, regenerate OpenAPI, then adapt frontend consumers.
- Pattern: layout extensibility
  register custom layouts via providers and preserve deterministic fallbacks.

## Anti-Patterns

- Treating design packages as optional CSS rather than contract infrastructure.
- Hardcoding brand styles inside shared primitives.
- Embedding orchestration/state logic in primitive components.
- Breaking slot or template names without migration path.
- Shipping backend schema changes without OpenAPI and frontend consumer verification.

## Adoption Checklist

- Add `@anarchitects/common-angular-design`, call `applyAnxBaseStyles()`, and register `provideDesignSystemConfig(...)` in app providers.
- Adopt `@anarchitects/common-angular-ui-composition` slot/template contracts in shared and domain UI.
- Use `@anarchitects/common-angular-ui-primitives` as base visual building blocks.
- Add `@anarchitects/common-angular-ui-layouts` only when runtime-selectable layout behavior is required.
- Keep forms and auth frontend packages aligned with backend contracts (`@anarchitects/forms-angular`, `@anarchitects/auth-angular`, `@anarchitects/forms-nest`, `@anarchitects/auth-nest`).
- Use [Theme Migration Guide](/guides/theme-migration.html) when moving existing apps away from manual root `data-anx-*` setup.
- Validate docs and generated outputs:
  `yarn nx run docs-hub:validate-content`,
  `yarn nx run docs-hub:build`,
  `yarn nx run docs-hub:verify`.
