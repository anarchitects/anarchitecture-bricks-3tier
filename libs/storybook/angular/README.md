# storybook-angular

Storybook host for Angular library stories in this workspace.

This is an internal documentation and compatibility-test host. It is deliberately
private and must not be published as an npm package.

## Purpose

This package configures Storybook rendering context, including design-theme
wrapping used by component stories. It consumes the aggregate
`@anarchitects/tailwind` entry point and compiles it with the Tailwind v4
PostCSS plugin.

## Theme setup in Storybook

Storybook uses decorator-level wrappers and the foundation's canonical
`data-theme="light|dark"` and `data-density="comfortable|compact"` attributes
to set story context. Surface, layout, and column attributes remain local
Storybook controls for representative legacy components.

The preview stylesheet demonstrates aggregate easy-mode consumption:

```css
@import '@anarchitects/tailwind';
@source './preview.ts';
@source '../../../auth/angular';
@source '../../../forms/angular';
@source '../../../common/angular';
```

The Angular examples provide the corresponding easy and advanced consumer
setups, including explicit theme/base/utilities composition and token
overrides.

## Guidance

- Use Storybook decorators for story isolation and toolbar-driven preview
  controls.
- Keep styling CSS-first; do not add a runtime Tailwind wrapper or a
  `tailwind.config.*` file.
- For migration and canonical setup details, use:
  - `docs/guides/design-ui-systems.md`
  - `docs/guides/theme-migration.md`
