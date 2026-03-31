# @anarchitects/common-angular-design/contracts

Public design-system contract for stable hooks and semantic naming.

## Exposes

- Stable host data attributes (`data-anx-*`)
- V1 managed root-sync subset for `theme`, `density`, and `surface`
- Allowed values for density/surface/layout
- Semantic class naming contract split by category (shell utilities vs. design hooks)
- Type guards for contract-safe value checks
- Package author CSS class rules

`data-anx-layout` and `data-anx-columns` remain explicit host attributes in the
current single-source theme-context slice.

## CSS Class Categories

### Shell Utility Classes (Consumer Use Only)

These are layout utilities for consumer app shells. **Do not apply to package component host elements.**

| Class        | Role                    | Default Style                                                                                      |
| ------------ | ----------------------- | -------------------------------------------------------------------------------------------------- |
| `anx-region` | Block padding wrapper   | `padding-block: var(--anx-layout-block-padding-current); padding-inline: var(--anx-sys-space-lg);` |
| `anx-stack`  | Vertical grid flow      | `display: grid; gap: var(--anx-layout-gap-stack);`                                                 |
| `anx-inline` | Flex inline row         | `display: flex; flex-wrap: wrap; align-items: center; gap: var(--anx-layout-gap-inline);`          |
| `anx-grid`   | Named multi-column grid | `display: grid; grid-template-columns: repeat(var(--anx-layout-columns), ...);`                    |

### Design Hook Classes (Component-Safe)

These classes define visual treatment and typography safe for component styling.

| Class         | Role                       | Use Case                                                                         |
| ------------- | -------------------------- | -------------------------------------------------------------------------------- |
| `anx-surface` | Visual surface treatment   | Apply to `anx-card`, containers, and elements that need border/shadow/background |
| `anx-heading` | Heading typography         | Apply to heading elements for consistent sizing                                  |
| `anx-text`    | Muted body text            | Apply to secondary/helper text                                                   |
| `anx-action`  | Button-like action styling | Apply to interactive elements                                                    |

## Package Author Rules

When building package components, follow these CSS class rules:

### ✅ Do

- Use `:host { padding: ...; gap: ...; }` CSS for component-internal spacing
- Compose design hook classes (`anx-surface`, `anx-heading`, etc.) into component styling
- Use component-specific BEM classes (`anx-card__header`, `anx-field__label`, etc.) for internal structure

### ❌ Don't

- Apply shell utility classes (`anx-region`, `anx-stack`, `anx-inline`, `anx-grid`) to component `host: { class }`
- Duplicate consumer spacing utilities on package component hosts

**Rationale:** Applying shell utilities to package host elements causes double-spacing
when the component is nested inside a consumer's layout container using the same utilities.

## Migration Target (Phase 2: #221)

The following components currently apply shell utility classes to their host elements
and will be refactored in #221 to use `:host` CSS instead:

- `@anarchitects/common-angular-ui-layouts/host` — `AnarchitectsUiLayoutHost` (applies `anx-region anx-stack`)
- `@anarchitects/common-angular-ui-layouts/defaults` — `AnarchitectsUiDefaultListLayoutRenderer` and other renderers (apply `anx-stack`)
- `@anarchitects/common-angular-ui-primitives/surfaces` — `AnarchitectsCard` (applies `anx-stack`)
- `@anarchitects/common-angular-ui-primitives/form-controls` — `AnarchitectsField` (applies `anx-stack`)

## Type Guards

```ts
import { isAnxShellUtilityClass } from '@anarchitects/common-angular-design/contracts';

isAnxShellUtilityClass('anx-region'); // true
isAnxShellUtilityClass('anx-surface'); // false
```
