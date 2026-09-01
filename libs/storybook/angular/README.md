# storybook-angular

Storybook host for Angular library stories in this workspace.

This is an internal documentation and compatibility-test host. It is deliberately
private and must not be published as an npm package.

## Purpose

This package configures Storybook rendering context, including design-theme
wrapping used by component stories.

## Theme setup in Storybook

Storybook uses decorator-level wrappers and local `data-anx-*` attributes to
set story context. This is intentional for isolated story rendering.

This differs from application bootstrap, where canonical setup is:

1. `applyAnxBaseStyles()` before render
2. `provideDesignSystemConfig(...)` at app root

## Guidance

- Use Storybook decorators for story isolation and toolbar-driven preview
  controls.
- Do not treat Storybook wrapper attributes as the canonical app-consumer setup.
- For migration and canonical setup details, use:
  - `docs/guides/design-ui-systems.md`
  - `docs/guides/theme-migration.md`
