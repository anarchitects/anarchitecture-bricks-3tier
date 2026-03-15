# @anarchitects/common-angular-design/styles

Base stylesheet contract for the shared Angular design system.

## Apply base styles

```ts
import { applyAnxBaseStyles } from '@anarchitects/common-angular-design/styles';

applyAnxBaseStyles();
```

Then scope design-system usage under the root class and hooks:

```html
<section class="anx-root" data-anx-theme="default" data-anx-density="comfortable" data-anx-surface="plain" data-anx-layout="list" data-anx-columns="1"></section>
```
