# @anarchitects/common-angular-design/contracts

Public design-system contract for stable hooks and semantic naming.

## Exposes

- Stable host data attributes (`data-anx-*`)
- V1 managed root-sync subset for `theme`, `density`, and `surface`
- Allowed values for density/surface/layout
- Semantic class naming contract for future primitives and layouts
- Type guards for contract-safe value checks

`data-anx-layout` and `data-anx-columns` remain explicit host attributes in the
current single-source theme-context slice.
