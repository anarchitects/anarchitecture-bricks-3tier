# @anarchitects/common-angular-ui-composition

Shared UI composition contracts for Angular bricks.

This package defines stable composition conventions between primitives,
domain UI components, and upcoming layout infrastructure.

## Entry points

- `@anarchitects/common-angular-ui-composition/contracts`
- `@anarchitects/common-angular-ui-composition/projection`
- `@anarchitects/common-angular-ui-composition/templates`

## Composition model

- Canonical slot names via `anxSlot="..."`
- Backward-compatible slot aliases for existing primitives
- Template contracts via `ng-template[anxTemplate]`
- Schema token (`ANX_COMPOSITION_SCHEMA`) for future layout discovery

## Canonical slot usage

```html
<anarchitects-ui-card>
  <div anxSlot="header">Title</div>
  <p anxSlot="content">Body</p>
  <div anxSlot="footer">Actions</div>
</anarchitects-ui-card>
```

## Template usage

```html
<ng-template anxTemplate="item" let-item>{{ item.name }}</ng-template> <ng-template anxTemplate="empty">No items</ng-template>
```
