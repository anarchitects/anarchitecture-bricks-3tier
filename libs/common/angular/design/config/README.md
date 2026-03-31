# @anarchitects/common-angular-design/config

Typed configuration and provider helpers for the shared Angular design-system context.

## Usage

Canonical setup is provider-only:

```ts
import { provideDesignSystemConfig } from '@anarchitects/common-angular-design/config';

providers: [
  ...provideDesignSystemConfig({
    theme: 'acme',
    density: 'compact',
    surface: 'card',
    layout: 'grid',
    columns: 3,
  }),
];
```

`provideDesignSystemConfig(...)` now applies `anx-root`,
`data-anx-theme`, `data-anx-density`, and `data-anx-surface` to
`document.documentElement` during bootstrap.

`layout` and `columns` remain explicit in v1. Set those attributes where layout
scoping is required.

Use the directive when a subtree needs its own scoped root:

```html
<section anarchitectsDesignRoot data-anx-layout="grid" data-anx-columns="3"></section>
```

`anarchitectsDesignRoot` still resolves precedence as directive input, then
explicit host attributes, then provider config.

`provideDocumentDesignSystemDomSync()` remains available as a low-level compat
helper. Using it alongside `provideDesignSystemConfig(...)` is harmless and
idempotent:

```ts
import { provideDesignSystemConfig, provideDocumentDesignSystemDomSync } from '@anarchitects/common-angular-design/config';

providers: [
  ...provideDesignSystemConfig({
    theme: 'acme',
    density: 'compact',
    surface: 'card',
    layout: 'grid',
    columns: 3,
  }),
  ...provideDocumentDesignSystemDomSync(),
];
```

Existing manual `data-anx-theme`, `data-anx-density`, and `data-anx-surface`
attributes remain supported and win over provider-derived defaults.
