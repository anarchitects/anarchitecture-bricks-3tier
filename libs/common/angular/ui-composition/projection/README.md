# @anarchitects/common-angular-ui-composition/projection

Projection directives for named composition slots.

## Exposes

- `AnxSlotDirective` (`[anxSlot]`)

## Usage

```html
<div anxSlot="header">Header</div>
<div anxSlot="app-dashboard-widget">Consumer extension slot</div>
```

The directive normalizes known values and sets `data-anx-slot`
for stable styling and layout targeting hooks.
