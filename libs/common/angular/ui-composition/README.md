# @anarchitects/common-angular-ui-composition

> Transition status: retained for the final compatibility line; do not adopt for new work. Domain-owned
> Angular projection replaces this shared abstraction under
> [ADR-0003](../../../../docs/adr/0003-adopt-tailwind-v4-frontend-foundation-and-retire-common-angular-ui-packages.md).
> Published versions will not be unpublished.

Shared UI composition contracts for Angular bricks.

This package defines stable composition conventions between primitives,
domain UI components, and upcoming layout infrastructure.

## Features

- Canonical slot + template contracts for reusable Angular UI composition
- Backward-compatible alias support while converging on canonical slot names
- Shared schema tokens for future runtime layout discovery

## Installation

```bash
npm install @anarchitects/common-angular-ui-composition
# or
yarn add @anarchitects/common-angular-ui-composition
```

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

## Usage

Use composition contracts inside domain UI components and shared primitives to keep projection APIs stable while allowing app-level template customisation.

## Development notes

- Add new slot/template names only when they are generic and reusable.
- Keep legacy alias support non-breaking during migrations.
- Treat this package as contract-only infrastructure; no domain behavior.
