# @anarchitects/common-angular-ui-primitives

Reusable Angular UI primitives for Anarchitecture bricks.

This package builds on `@anarchitects/common-angular-design` and provides
non-branded, token-driven primitives that are extensible by consumer apps.

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
