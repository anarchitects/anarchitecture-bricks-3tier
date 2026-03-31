# @anarchitects/common-angular-design/styles

Base stylesheet contract for the shared Angular design system.

## Apply base styles

```ts
import { applyAnxBaseStyles } from '@anarchitects/common-angular-design/styles';

applyAnxBaseStyles();
```

Then scope design-system usage under the root class and hooks:

```html
<section anarchitectsDesignRoot data-anx-layout="list" data-anx-columns="1"></section>
```

The `anarchitectsDesignRoot` directive is the canonical way to attach theme,
density, and surface attributes. Existing manual `class="anx-root"` and
`data-anx-*` attributes remain valid when an app needs explicit overrides.
