# @anarchitects/common-angular-design/styles

Base stylesheet contract for the shared Angular design system.

## Apply base styles

```ts
import { applyAnxBaseStyles } from '@anarchitects/common-angular-design/styles';

applyAnxBaseStyles();
```

Call `applyAnxBaseStyles()` once during app bootstrap before rendering UI.

With provider-driven sync, the root class and managed theme attributes are
applied to `document.documentElement` automatically. Render content normally and
set explicit layout attributes only where needed:

```html
<section data-anx-layout="list" data-anx-columns="1"></section>
```

Use `anarchitectsDesignRoot` only when a subtree needs explicit local theme,
density, or surface overrides. Existing manual `class="anx-root"` and
`data-anx-*` attributes remain valid when an app needs explicit control.

For migration guidance away from manual root attributes, see
`docs/guides/theme-migration.md`.
