# Theme Migration Guide

## Intent

This guide explains how to migrate to a single-source design setup for
`@anarchitects/common-angular-design`, including shell/layout collision
prevention introduced in the Phase 2 hardening.

Goals:

- Keep one canonical setup path for new apps.
- Migrate existing apps away from manual root `data-anx-*` attributes safely.
- Preserve backward compatibility during rollout.
- Prevent shell utility class collisions across shared package internals.

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

## Theme Before and After

Before (manual root attributes):

```html
<html class="anx-root" data-anx-theme="ocean" data-anx-density="compact" data-anx-surface="card">
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

## Shell Utility Collision Migration (Phase 2)

Shell utility classes are consumer shell layout classes only:

- `anx-region`
- `anx-stack`
- `anx-inline`
- `anx-grid`

Shared package internals (`ui-layouts`, `ui-primitives`) must not rely on these
classes for component host spacing.

### Migration Objective

Move shared component spacing to explicit component CSS and keep shell utility
usage in app shell wrappers.

### Before (collision-prone package host usage)

```ts
@Component({
  host: {
    class: 'anx-default-layout anx-stack',
  },
})
export class DefaultLayoutComponent {}
```

### After (contract-safe package host usage)

```ts
@Component({
  host: {
    class: 'anx-default-layout',
  },
  styles: `
    :host {
      display: grid;
      gap: var(--anx-layout-gap-stack);
      padding: var(--anx-layout-block-padding-current);
    }
  `,
})
export class DefaultLayoutComponent {}
```

### Consumer Shell Usage (still valid)

```html
<section class="anx-region anx-stack" data-anx-layout="grid">
  <anarchitects-forms-ui-form></anarchitects-forms-ui-form>
</section>
```

## Recommended Migration Sequence

1. Add provider setup in bootstrap and keep existing manual root attributes.
2. Verify runtime output still matches expected theme context.
3. Remove manual root `data-anx-*` attributes when provider values are verified.
4. Audit shared package hosts and templates for shell utility class usage.
5. Replace package-internal shell utility usage with explicit component CSS.
6. Keep shell utility classes in consumer wrappers only.

## Validation Checklist

Run both contract and downstream checks:

1. `yarn nx run guardrails:test`
2. `yarn nx run forms-angular-ui:test --testFile=libs/forms/angular/ui/src/form.spec.ts`
3. `yarn nx run docs-hub:validate-content`
4. `yarn nx run docs-hub:build`
5. `yarn nx run docs-hub:verify`

Evidence references:

- Guardrail enforcement: `tools/guardrails/shell-utility-collision.test.mjs`
- Downstream regression coverage: `libs/forms/angular/ui/src/form.spec.ts`

## Storybook Note

Storybook often uses local decorators that set `data-anx-*` in story wrappers.
That pattern is valid for story isolation and does not replace canonical
app-bootstrap setup.

## Related Guides

- [Design/UI Systems Guide](/guides/design-ui-systems.html)
- [Angular Guide](/guides/angular.html)
