# Theme Migration Guide

## Intent

This guide explains how to migrate to a single-source theme setup for
`@anarchitects/common-angular-design`.

Goal:

- Keep one canonical setup path for new apps.
- Migrate existing apps away from manual root `data-anx-*` attributes safely.
- Preserve backward compatibility during rollout.

## Canonical Setup

Use this app-bootstrap sequence:

1. Call `applyAnxBaseStyles()` once before app render.
2. Register `provideDesignSystemConfig(...)` in app providers.
3. Keep `data-anx-layout` and `data-anx-columns` explicit only where local
   layout scope is needed.

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

## Before and After

Before (manual root attributes):

```html
<html
  class="anx-root"
  data-anx-theme="ocean"
  data-anx-density="compact"
  data-anx-surface="card"
>
  ...
</html>
```

After (provider-driven root attributes):

```ts
providers: [
  ...provideDesignSystemConfig({
    theme: 'ocean',
    density: 'compact',
    surface: 'card',
  }),
];
```

The provider writes managed attributes on `document.documentElement` during
bootstrap.

## Resolution Precedence

Managed values (`theme`, `density`, `surface`) resolve in this order:

1. Directive input (`designTheme`, `designDensity`, `designSurface`)
2. Explicit attribute value (`data-anx-*`)
3. Provider config value

This precedence applies to subtree overrides with
`anarchitectsDesignRoot` and supports incremental migration.

## Backward Compatibility

Backward compatibility is intentionally preserved:

- Existing manual `data-anx-theme`, `data-anx-density`, and `data-anx-surface`
  remain supported.
- Explicit manual attributes stay authoritative over provider defaults.
- Mixed mode is valid during migration windows.

## Recommended Migration Sequence

1. Add provider setup in bootstrap and keep existing manual attributes.
2. Verify runtime output still matches expected theme context.
3. Remove manual root `data-anx-*` attributes when provider values are verified.
4. Keep explicit manual attributes only where deliberate overrides are required.

## Storybook Note

Storybook often uses local decorators that set `data-anx-*` in story wrappers.
That pattern is valid for story isolation and does not replace canonical
app-bootstrap setup.

## Related Guides

- [Design/UI Systems Guide](/guides/design-ui-systems.html)
- [Angular Guide](/guides/angular.html)
