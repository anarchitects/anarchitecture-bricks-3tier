# Legacy Common Angular Theme Migration Reference

## Status

This document describes the legacy `@anarchitects/common-angular-design` path only. It is retained for
applications consuming the final Common Angular compatibility line; it is not the target for new work.

[ADR-0003](/adr/0003-adopt-tailwind-v4-frontend-foundation-and-retire-common-angular-ui-packages.html)
adopts Tailwind CSS v4 and schedules removal of:

- `@anarchitects/common-angular-design`
- `@anarchitects/common-angular-ui-composition`
- `@anarchitects/common-angular-ui-layouts`
- `@anarchitects/common-angular-ui-primitives`

Use the [Frontend Foundation Guide](/guides/design-ui-systems.html) for the target ownership and CSS entry
points. The complete Tailwind and Signal Forms consumer migration steps will be published after those APIs
are implemented under epic #362.

## Maintaining The Final Legacy Line

Existing applications can continue using the legacy provider and stylesheet contracts until they migrate:

```ts
import { provideDesignSystemConfig } from '@anarchitects/common-angular-design/config';
import { applyAnxBaseStyles } from '@anarchitects/common-angular-design/styles';

applyAnxBaseStyles();

export const appConfig = {
  providers: [
    provideDesignSystemConfig({
      theme: 'system',
      density: 'comfortable',
      surface: 'default',
    }),
  ],
};
```

During compatibility maintenance:

- keep token overrides scoped through the documented legacy contracts
- avoid introducing new dependencies on the four retiring packages
- treat the final Angular 21/22-compatible publication as the migration source line
- do not assume a runtime design provider will exist in the Tailwind foundation

## Target Mapping

| Legacy mechanism                      | Target direction                                      |
| ------------------------------------- | ----------------------------------------------------- |
| token provider and typed token names  | Tailwind `@theme` and CSS variables                   |
| injected theme/density styling config | host CSS selectors and theme overrides                |
| `applyAnxBaseStyles()`                | aggregate or base CSS import                          |
| shell semantic classes                | Tailwind utilities or documented foundation utilities |
| global slot/schema package            | domain-owned Angular projection                       |
| generic runtime layout registry       | domain-owned behavior or host page composition        |
| generic Angular primitives            | domain UI or host components styled with Tailwind     |

Tailwind replaces styling infrastructure, not Angular behavior. When migrating a primitive or layout,
preserve its interaction, focus, ARIA, validation, and state semantics in the owning Angular code.

## Publication Policy

The legacy packages stay downloadable. After the replacement is accepted and workspace dependencies are
removed, npm versions will be marked deprecated with a pointer to `@anarchitects/tailwind` and the final
migration guide. They will never be unpublished.
