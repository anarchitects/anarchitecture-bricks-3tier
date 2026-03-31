# @anarchitects/common-angular-design

Reusable Angular design foundations for Anarchitecture bricks.

This package provides the design contract foundation: tokens, semantic hook
conventions, base scoped styles, and typed configuration providers. It is
intentionally unbranded and extensible for consumer applications.

## Features

- Typed design-system config providers for theme, density, surface, and layout defaults
- Explicit root-host directive for syncing theme, density, and surface to DOM attributes
- Shared semantic token contracts for cross-library visual consistency
- Base styles and semantic hooks designed for consumer override
- Package-author rules for shell utility class boundaries

## Installation

```bash
npm install @anarchitects/common-angular-design
# or
yarn add @anarchitects/common-angular-design
```

## Entry points

- `@anarchitects/common-angular-design/config`
  - Typed provider helpers and injection tokens (`provideDesignSystemConfig`)
- `@anarchitects/common-angular-design/tokens`
  - Typed CSS custom property names and default token values
- `@anarchitects/common-angular-design/contracts`
  - Stable data-attribute and semantic-class contracts
- `@anarchitects/common-angular-design/styles`
  - Base stylesheet contract and package-author class rules

## Shell Utility Class Contract

Source-of-truth symbols in `contracts`:

- `ANX_SHELL_UTILITY_CLASSNAMES`
- `ANX_DESIGN_HOOK_CLASSNAMES`
- `ANX_SEMANTIC_CLASSNAMES` (backward-compatible union)
- `isAnxShellUtilityClass(...)`

Package-author rule in `styles`:

- `ANX_PACKAGE_AUTHOR_RULES.forbiddenOnComponentHost`

Shell utility classes (`anx-region`, `anx-stack`, `anx-inline`, `anx-grid`) are
consumer shell layout classes and must not be applied to shared package
component hosts. Use explicit `:host` CSS for component-internal spacing.

## Consumer extensibility model

Core is closed around naming and contracts.
Consumers extend at the edges by:

1. Overriding semantic tokens (`--anx-sys-*`, `--anx-layout-*`)
2. Defining app-specific themes under `data-anx-theme="..."`
3. Wrapping shared primitives/layouts in app-level components later
4. Applying app-specific styles without modifying core libraries

## Quickstart

### 1) Apply base styles before render

```ts
import { applyAnxBaseStyles } from '@anarchitects/common-angular-design/styles';

applyAnxBaseStyles();
```

### 2) Register context defaults

```ts
import { provideDesignSystemConfig } from '@anarchitects/common-angular-design/config';

export const appConfig = {
  providers: [
    ...provideDesignSystemConfig({
      theme: 'default',
      density: 'comfortable',
      surface: 'plain',
      layout: 'list',
      columns: 1,
    }),
  ],
};
```

### 3) Keep shell classes in consumer wrappers

```html
<section class="anx-region anx-stack" data-anx-layout="list" data-anx-columns="1">
  <h2 class="anx-heading">Contact</h2>
  <p class="anx-text">A neutral foundation, ready for consumer theming.</p>
</section>
```

`provideDesignSystemConfig(...)` applies `anx-root`, `data-anx-theme`,
`data-anx-density`, and `data-anx-surface` to `document.documentElement`
automatically during bootstrap.

`data-anx-layout` and `data-anx-columns` remain explicit where local layout
scoping is needed.

Use `anarchitectsDesignRoot` only when a subtree needs explicit local theme,
density, or surface overrides.

Existing apps can keep manual `data-anx-theme`, `data-anx-density`, and
`data-anx-surface` attributes during migration. Explicit manual attributes stay
authoritative over provider-derived defaults.

## Usage

Use this package as the root design contract for shared Angular UI libraries.
Apply base styles once, configure provider defaults at app bootstrap, and keep
shell utility classes in consumer wrappers rather than shared package hosts.

## Validation workflow

For shell/layout contract migration checks:

1. `yarn nx run guardrails:test`
2. `yarn nx run forms-angular-ui:test --testFile=libs/forms/angular/ui/src/form.spec.ts`
3. `yarn nx run docs-hub:validate-content`
4. `yarn nx run docs-hub:build`
5. `yarn nx run docs-hub:verify`

## Documentation

- System guide: `docs/guides/design-ui-systems.md`
- Migration guide: `docs/guides/theme-migration.md`

## Development notes

- Keep this package unbranded and contract-first.
- Add new tokens and semantic hooks only when they generalize across multiple domains.
- Prefer consumer extension points over package-specific styling decisions.
