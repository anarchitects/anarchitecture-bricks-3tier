# @anarchitects/common-angular-design/config

Typed configuration and provider helpers for the shared Angular design-system context.

## Usage

Canonical setup uses an explicit app-shell host element:

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

```html
<section anarchitectsDesignRoot data-anx-layout="grid" data-anx-columns="3"></section>
```

`anarchitectsDesignRoot` manages `theme`, `density`, and `surface` on that
explicit host.
`layout` and `columns` remain explicit in v1.

When a host app cannot annotate its shell template, use the document fallback:

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
