# @anarchitects/common-angular-ui-layouts

> Transition status: retained for the final compatibility line; do not adopt for new work. Domain-owned
> behavior and host-app composition replace this shared runtime under
> [ADR-0003](../../../../docs/adr/0003-adopt-tailwind-v4-frontend-foundation-and-retire-common-angular-ui-packages.md).
> Published versions will not be unpublished.

Pluggable layout runtime infrastructure for Angular bricks.

This package provides layout contracts, registry, runtime host, and built-in
default layouts. It is shared infrastructure only and does not embed
domain-specific behavior.

## Features

- Layout contracts and runtime host components for pluggable rendering
- Registry-based layout resolution with explicit defaults
- Default implementations for form/list/detail layout kinds
- Contract-safe host styling aligned with shell utility collision prevention

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

## Shell Utility Boundary

Shell utility classes (`anx-region`, `anx-stack`, `anx-inline`, `anx-grid`) are
consumer shell layout classes and must not be used by package host bindings or
internal templates.

Use explicit component CSS for spacing and flow in layout renderers.

Incorrect:

```ts
host: { class: 'anx-default-layout anx-stack' }
```

Correct:

```ts
host: { class: 'anx-default-layout' }
```

```css
:host {
  display: grid;
  gap: var(--anx-layout-gap-stack);
  padding: var(--anx-layout-block-padding-current);
}
```

## Consumer extension

Consumer apps can add layouts without modifying core by:

1. Creating a renderer component that accepts `context: AnxResolvedLayoutContext`
2. Registering it with `provideAnxLayouts([...])`
3. Overriding defaults with `provideAnxLayoutDefaults({...})`

## Usage

Use this package when runtime-selectable layout behavior is required. Keep
layout resolution in shared infrastructure and keep shell utility class usage in
consumer route/page wrappers.

## Validation workflow

Contract and downstream validation references:

1. `yarn nx run guardrails:test`
2. `yarn nx run forms-angular-ui:test --testFile=libs/forms/angular/ui/src/form.spec.ts`

## Documentation

- System guide: `docs/guides/design-ui-systems.md`
- Migration guide: `docs/guides/theme-migration.md`

## Development notes

- Keep runtime resolution deterministic and side-effect free.
- Register new layouts through provider APIs rather than hardcoded switches.
- Avoid domain-specific assumptions in shared layout contracts.
