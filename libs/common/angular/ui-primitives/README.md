# @anarchitects/common-angular-ui-primitives

Reusable Angular UI primitives for Anarchitecture bricks.

This package builds on `@anarchitects/common-angular-design` and provides
non-branded, token-driven primitives that are extensible by consumer apps.

## Features

- Non-branded reusable primitives for actions, controls, surfaces, and feedback
- Stable semantic hooks and projection slots for composition consistency
- Token-driven styling with consumer override support

## Installation

```bash
npm install @anarchitects/common-angular-ui-primitives
# or
yarn add @anarchitects/common-angular-ui-primitives
```

## Entry points

- `@anarchitects/common-angular-ui-primitives/actions`
- `@anarchitects/common-angular-ui-primitives/form-controls`
- `@anarchitects/common-angular-ui-primitives/surfaces`
- `@anarchitects/common-angular-ui-primitives/feedback`
- `@anarchitects/common-angular-ui-primitives/contracts`

## Extensibility model

- Stable host classes (`anx-*`) and `data-*` variant hooks
- Component-level CSS variables (`--anx-cmp-*`) with system-token fallbacks
- Canonical projection slots via `anxSlot="..."` with legacy alias support
- Wrapper-friendly APIs for consumer-specific styling and behavior

## Composition contract alignment

- Canonical slot selectors:
  - `anxSlot="start|end|header|content|footer|actions|label|hint|error|..."`
- Legacy aliases remain supported:
  - `anxStart`, `anxEnd`, `anxActions`, `anxCardHeader`, `anxCardFooter`, etc.
- Primitive composition schemas are exported from:
  - `@anarchitects/common-angular-ui-primitives/contracts`

## Phase 2 boundaries

- No domain behavior/state logic in primitives
- No app-branding defaults
- No integration into existing domain feature libraries in this phase

## Usage

Use primitives directly in feature and domain UI libraries, then layer app-specific wrappers/themes in consuming applications.

## Development notes

- Keep APIs focused on reusable visual building blocks.
- Preserve canonical slot names and compatibility aliases.
- Keep styling decisions token-based and consumer-extensible.
