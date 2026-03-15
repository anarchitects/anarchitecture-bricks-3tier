# @anarchitects/common-angular-ui-layouts

Pluggable layout runtime infrastructure for Angular bricks.

This package provides the Phase 3 layout system contracts, registry,
runtime host, and built-in default layouts. It is shared infrastructure
only and does not migrate domain `forms`/`auth` components in this phase.

## Entry points

- `@anarchitects/common-angular-ui-layouts/contracts`
- `@anarchitects/common-angular-ui-layouts/registry`
- `@anarchitects/common-angular-ui-layouts/host`
- `@anarchitects/common-angular-ui-layouts/defaults`

## Layout kinds and defaults

- `form`: `form:stacked`, `form:grid`, `form:inline`, `form:card`
- `list`: `list:list`, `list:grid`, `list:card`, `list:table`
- `detail`: `detail:page`, `detail:card`, `detail:sidebar`

## Resolution precedence

1. explicit host input `[layout]`
2. provider default from `ANX_LAYOUT_DEFAULTS[kind]`
3. built-in fallback for the kind

## Consumer extension

Consumer apps can add layouts without modifying core by:

1. Creating a renderer component that accepts `context: AnxResolvedLayoutContext`
2. Registering it with `provideAnxLayouts([...])`
3. Overriding defaults with `provideAnxLayoutDefaults({...})`
