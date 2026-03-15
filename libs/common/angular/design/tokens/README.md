# @anarchitects/common-angular-design/tokens

Typed design-token contract for CSS custom properties.

## Token Categories

- `ref`: internal reference scales
- `sys`: public semantic tokens for components
- `layout`: public semantic tokens for layout behavior
- `cmp`: reserved prefix for future primitive-specific tokens

Consumers should override `sys` and `layout` tokens in application themes.
