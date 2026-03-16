# @anarchitects/common-angular-ui-layouts

Pluggable layout runtime infrastructure for Angular bricks.

This package provides the Phase 3 layout system contracts, registry,
runtime host, and built-in default layouts. It is shared infrastructure
only and does not migrate domain `forms`/`auth` components in this phase.

## Features

- Layout contracts and runtime host components for pluggable rendering
- Registry-based layout resolution with explicit defaults
- Default implementations for form/list/detail layout kinds

## Installation

```bash
npm install @anarchitects/common-angular-ui-layouts
# or
yarn add @anarchitects/common-angular-ui-layouts
```

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

## Usage

Use this package when you need runtime-selectable layouts with deterministic fallback behavior across UI feature surfaces.

## Development notes

- Keep runtime resolution deterministic and side-effect free.
- Register new layouts through provider APIs rather than hardcoded switches.
- Avoid domain-specific assumptions in shared layout contracts.
