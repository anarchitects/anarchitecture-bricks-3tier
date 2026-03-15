# @anarchitects/common-angular-ui-composition/templates

Template composition contracts and helpers.

## Exposes

- `AnxTemplateDirective` (`ng-template[anxTemplate]`)
- `findAnxTemplate(...)`
- `groupAnxTemplatesByName(...)`

## Usage

```html
<ng-template anxTemplate="item" let-item>{{ item.name }}</ng-template>
<ng-template anxTemplate="empty">No items</ng-template>
```

Use `findAnxTemplate(...)` when resolving the active template at runtime.
