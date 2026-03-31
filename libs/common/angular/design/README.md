# @anarchitects/common-angular-design

Reusable Angular design foundations for Anarchitecture bricks.

This package provides the **Phase 1 design contract**: tokens, semantic hook conventions,
base scoped styles, and typed configuration providers. It is intentionally unbranded and
extensible for consumer applications.

## Features

- Typed design-system config providers for theme, density, surface, and layout defaults
- Explicit root-host directive for syncing theme, density, and surface to DOM attributes
- Shared semantic token contracts for cross-library visual consistency
- Base styles and semantic hooks designed for consumer override

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
  - Base stylesheet contract and import conventions

## Consumer extensibility model

Core is closed around naming and contracts.
Consumers extend at the edges by:

1. Overriding semantic tokens (`--anx-sys-*`, `--anx-layout-*`)
2. Defining app-specific themes under `data-anx-theme="..."`
3. Wrapping shared primitives/layouts in app-level components later
4. Applying app-specific styles without modifying core libraries

## Quickstart

### 1) Register context defaults

```ts
import { provideDesignSystemConfig, provideDocumentDesignSystemDomSync } from '@anarchitects/common-angular-design/config';

export const appConfig = {
  providers: [
    ...provideDesignSystemConfig({
      theme: 'default',
      density: 'comfortable',
      surface: 'plain',
      layout: 'list',
      columns: 1,
    }),
    // Optional fallback when an app cannot annotate its root shell element.
    ...provideDocumentDesignSystemDomSync(),
  ],
};
```

### 2) Apply base styles

```ts
import { applyAnxBaseStyles } from '@anarchitects/common-angular-design/styles';

applyAnxBaseStyles();
```

### 3) Scope usage with an explicit root host

```html
<section anarchitectsDesignRoot data-anx-layout="list" data-anx-columns="1">
  <div class="anx-region anx-stack">
    <h2 class="anx-heading">Contact</h2>
    <p class="anx-text">A neutral foundation, ready for consumer theming.</p>
  </div>
</section>
```

`anarchitectsDesignRoot` is the canonical setup path. It manages `data-anx-theme`,
`data-anx-density`, and `data-anx-surface` from the injected design config.
`data-anx-layout` and `data-anx-columns` remain explicit host attributes in this
slice.

Existing apps can keep manual `data-anx-theme`, `data-anx-density`, and
`data-anx-surface` attributes during migration. Explicit manual attributes stay
authoritative over provider-derived defaults.

## Usage

Use this package as the design contract foundation in app bootstrap, then layer `ui-primitives`, `ui-composition`, and domain UI libraries on top of the same token/context model.

## Phase 1 boundaries

- No integration into existing `forms` or `auth` Angular UI yet
- No primitive catalog rollout yet
- No full layout engine yet

## Development notes

- Keep this package unbranded and contract-first.
- Add new tokens and semantic hooks only when they generalize across multiple domains.
- Prefer consumer extension points over package-specific styling decisions.
