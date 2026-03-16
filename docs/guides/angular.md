# Angular Guide

## Intent

This guide explains how to build Angular applications with Anarchitecture Bricks using a layered architecture plus a contract-first design and UI system. It focuses on practical integration patterns, copy/paste setup steps, and safe extension points for teams consuming `@anarchitects/*` packages.

For shared cross-stack rules, also use the [Design/UI Systems Guide](/guides/design-ui-systems.html).

## Architecture

- Angular domain libraries follow: `ui <- feature -> state -> data-access`.
- Shared contracts come from TS packages (`@anarchitects/*-ts`) and generated API contracts.
- `config` and `util` are cross-layer helpers; avoid bypassing layer boundaries.
- State registration is explicit via provider helpers; no implicit global singleton store registration.

## Design System Foundations

Treat the design/UI stack as layered infrastructure:

1. `@anarchitects/common-angular-design`
2. `@anarchitects/common-angular-ui-composition`
3. `@anarchitects/common-angular-ui-primitives`
4. `@anarchitects/common-angular-ui-layouts`
5. domain UI packages (`@anarchitects/forms-angular/ui`, `@anarchitects/auth-angular/ui`, etc.)

Design package responsibilities:

- `common-angular-design`: token contracts, semantic hooks, base scoped styles, typed design config providers.
- `common-angular-ui-composition`: canonical slot/template contracts (`anxSlot`, `anxTemplate`) and projection conventions.
- `common-angular-ui-primitives`: non-branded reusable UI building blocks aligned to token contracts.
- `common-angular-ui-layouts`: runtime-selectable layout host/registry/defaults with deterministic fallback.

## Quick Start with Design/UI Stack

Bootstrap design context first, then wire domain packages:

```ts
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideDesignSystemConfig } from '@anarchitects/common-angular-design/config';
import { applyAnxBaseStyles } from '@anarchitects/common-angular-design/styles';
import { provideFormsDefaults } from '@anarchitects/forms-angular/config';
import { provideAuthConfig } from '@anarchitects/auth-angular/config';
import { provideAuthDataAccess } from '@anarchitects/auth-angular/data-access';
import { provideAuthState } from '@anarchitects/auth-angular/state';

applyAnxBaseStyles();

export const appConfig = {
  providers: [
    ...provideDesignSystemConfig({
      theme: 'default',
      density: 'comfortable',
      surface: 'plain',
      layout: 'list',
      columns: 1,
    }),
    provideHttpClient(withFetch()),
    provideFormsDefaults(),
    provideAuthConfig({ apiBaseUrl: 'https://api.example.com' }),
    provideAuthDataAccess(),
    provideAuthState(),
  ],
};
```

This ordering keeps design tokens and semantic hooks available before feature/UI components render.

## Theme and Token Customization

Keep shared libraries unbranded. Brand at app edges with tokens and scoped hooks:

- Override system tokens (`--anx-sys-*`, `--anx-layout-*`) in application styles.
- Use `data-anx-theme`, `data-anx-density`, `data-anx-surface`, `data-anx-layout` for controlled context switching.
- Keep component wrappers in app code if product-specific styling or behavior diverges.

Example:

```css
.anx-root[data-anx-theme='enterprise'] {
  --anx-sys-color-primary: #0f766e;
  --anx-sys-color-surface: #f8fafc;
  --anx-layout-content-max-width: 72rem;
}
```

## UI Composition and Primitives

Build composition APIs around canonical slots and templates so features stay wrapper-friendly and theme-safe:

- Use slot contracts (`anxSlot="header|content|footer|actions|..."`) for projected content.
- Use template contracts (`ng-template[anxTemplate]`) for customizable repeated/empty/content states.
- Prefer canonical slot names in new code; keep alias compatibility only as migration support.
- Keep primitives behavior-agnostic; feature/state layers own orchestration and domain decisions.

Example:

```html
<anarchitects-ui-card>
  <div anxSlot="header">Profile</div>
  <p anxSlot="content">User details</p>
  <div anxSlot="footer">
    <button anxSlot="actions">Save</button>
  </div>
</anarchitects-ui-card>

<ng-template anxTemplate="empty">No items</ng-template>
```

## Composition Cookbook

Use these repeatable patterns in feature and domain UI libraries:

- Pattern: stable projection API
  Use `anxSlot` names as public contract and avoid renaming existing slots once published.
- Pattern: app-level template specialization
  Accept templates via `anxTemplate` and let host apps provide alternate rendering for item/empty/action regions.
- Pattern: wrapper extension
  Wrap primitives in app-level components for branding or behavior rather than patching shared primitives.
- Pattern: compatibility migration
  Keep alias support (`anxStart`, `anxEnd`, etc.) only while migrating to canonical slots.

## Layout Runtime

Use `@anarchitects/common-angular-ui-layouts` for runtime layout selection with deterministic precedence:

1. explicit host input (`[layout]`)
2. provider defaults (`ANX_LAYOUT_DEFAULTS[kind]`)
3. built-in fallback by kind

Use layout runtime when you need app-level layout variation without forking domain UI components. Keep custom renderers as app-level extensions registered through provider APIs instead of domain-library code changes.

## Layout Cookbook

- Pattern: explicit route-level layout
  Set `[layout]` from route metadata when a screen requires deterministic rendering.
- Pattern: domain defaults
  Use `provideAnxLayoutDefaults(...)` for consistent kind defaults across a product area.
- Pattern: product override
  Register custom renderers with `provideAnxLayouts([...])` while preserving fallback behavior.
- Pattern: safe fallback
  Always keep built-in layout kind fallbacks so missing custom registrations do not break rendering.

## App Composition

Start with root providers in app bootstrap:

1. Provide design context (`provideDesignSystemConfig`) and apply base styles once.
2. Provide domain config (`provide*Config`), then data-access (`provide*DataAccess`).
3. Provide state (`provide*State`) at app, route, or feature scope as needed.
4. Use feature entry points for orchestration and UI entry points for presentational rendering.

Domain package strategy:

- `@anarchitects/forms-angular`: dynamic form retrieval/rendering/submission with config/data-access/state/feature/ui slices.
- `@anarchitects/auth-angular`: auth orchestration with config/data-access/state/feature/util/ui slices.
- Keep design/UI infrastructure package usage consistent across both domains to avoid divergent UX contracts.

## State/Data Access

- Keep HTTP integration inside `data-access`; never call endpoints directly from UI/feature components.
- Let `state` orchestrate loading/error/retry/cache and expose derived UI signals.
- Keep `ui` components presentational and token-driven; receive data via inputs and emit interaction events.
- Keep route/API contracts synced with backend by regenerating OpenAPI and updating generated clients after schema changes.
- Keep design-system decisions (theme, density, surface, layout defaults) outside domain state.

## Testing and Docs Workflow

- Unit-test feature/state logic independently from primitive visuals.
- Snapshot or interaction-test wrapper components for slot/template behavior.
- Validate docs quality with `yarn nx run docs-hub:validate-content`.
- Rebuild docs output with `yarn nx run docs-hub:build`.
- Verify rendered output and required links with `yarn nx run docs-hub:verify`.
- When backend contracts change, run OpenAPI generation and validate affected UI flows before merge.

## Common Pitfalls

- Treating design packages as optional styling instead of foundational contracts.
- Hardcoding app branding inside shared primitives instead of consumer overlays/tokens.
- Mixing orchestration logic into UI components or primitives.
- Registering stores globally by default without intended scope.
- Bypassing generated API clients with manual endpoint strings.
- Importing internal source paths instead of published secondary entry points.
- Skipping OpenAPI/client resync after DTO/schema updates.
