# @anarchitects/common-angular-design/config

Typed configuration and provider helpers for the shared Angular design-system context.

## Usage

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
