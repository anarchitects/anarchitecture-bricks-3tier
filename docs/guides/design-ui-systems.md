# Frontend Foundation Guide

## Intent

This guide defines the target frontend foundation for Anarchitecture Bricks.
[ADR-0003](/adr/0003-adopt-tailwind-v4-frontend-foundation-and-retire-common-angular-ui-packages.html)
supersedes the previous layered Common Angular UI-system direction. The current packages remain supported
through the staged transition, but new frontend-foundation work targets Tailwind CSS v4.

Contract ownership for DTOs and domain models remains canonical in the
[TS Contracts Guide](/guides/ts-contracts.html).

## System Layers

The target model separates CSS infrastructure from application behavior:

```text
@anarchitects/tailwind
  theme.css       design tokens and theme conventions
  base.css        shared baseline and accessibility-minded defaults
  utilities.css   shared utilities and variants

Angular domain capabilities
  ui              behavior-bearing components and domain projection
  feature         workflow composition
  state           explicit scoped state
  data-access     transport adapters

host application
  routes, page shells, audience policy, and product-specific composition
```

Angular domains continue to follow `ui <- feature -> state -> data-access`. Nest domains continue to
follow `presentation -> application <- infrastructure`. Tailwind does not change either dependency rule.

## Token and Theme Model

The `@anarchitects/tailwind` package exposes an aggregate easy mode:

```css
@import '@anarchitects/tailwind';
```

Advanced consumers can compose or replace individual layers:

```css
@import '@anarchitects/tailwind/theme.css';
@import '@anarchitects/tailwind/base.css';
@import '@anarchitects/tailwind/utilities.css';
```

The implementation uses Tailwind v4 CSS-first configuration: CSS imports, `@theme`, CSS-defined
utilities and variants, and documented `@source`. It does not introduce a legacy JavaScript configuration
preset or an Angular runtime wrapper.

Tailwind ignores dependencies during automatic source detection. A consuming application must register
published packages whose compiled templates contain utility classes, using a path appropriate to that
application:

```css
@source "../node_modules/@anarchitects";
```

Paths are relative to the stylesheet that declares them. Use the package README for installed-package,
workspace-library, and consumer-source examples, and verify the resulting production CSS.

## Composition Contracts

Composition is behavior, so domain Angular packages own the slots and templates they render. Use native
Angular content projection and template APIs locally in `@anarchitects/forms-angular`,
`@anarchitects/auth-angular`, or another owning capability. Do not create a workspace-wide composition
schema merely to standardize styling.

`@anarchitects/common-angular-ui-composition` remains available during the final compatibility wave. Its
necessary domain behavior moves to the relevant domain before the shared package is removed.

## Primitive Contracts

Behavior-bearing controls belong in domain Angular UI or the consuming application. Their owner remains
responsible for interaction, focus, ARIA, validation, and state semantics. General presentation should use
Tailwind utilities directly instead of wrapping every visual element in an Anarchitects component.

`@anarchitects/common-angular-ui-primitives` remains available during the final compatibility wave but is
not the target for new primitives. Tailwind replaces its styling infrastructure, not its Angular behavior.

## Layout Runtime Contracts

Domain-specific runtime layout behavior belongs to the domain that needs it. Route layouts, product shells,
and audience-specific composition belong to the host application. A generic runtime registry is warranted
only when cross-domain behavioral reuse is demonstrated, not simply to select a CSS arrangement.

`@anarchitects/common-angular-ui-layouts` remains available during the final compatibility wave. Required
form behavior moves into `@anarchitects/forms-angular`; generic page composition moves to consumers.

## Domain Integration Matrix

| Capability                               | Owner after migration                                           |
| ---------------------------------------- | --------------------------------------------------------------- |
| Design tokens and CSS theme defaults     | `@anarchitects/tailwind/theme.css` plus consumer overrides      |
| Base styles                              | `@anarchitects/tailwind/base.css`                               |
| Shared CSS utilities and variants        | `@anarchitects/tailwind/utilities.css`                          |
| Dark mode and density conventions        | CSS variables/selectors in the Tailwind foundation and host CSS |
| Domain slots and templates               | The Angular domain package that renders them                    |
| Form/list/detail behavior                | The owning domain Angular package                               |
| Route layouts and product shells         | The consuming application                                       |
| Behavior-bearing controls                | Domain Angular UI or the consuming application                  |
| Focus, ARIA, validation, and interaction | The behavior-bearing Angular component and its consumer         |

The full retained/retired mapping is canonical in
[ADR-0003](/adr/0003-adopt-tailwind-v4-frontend-foundation-and-retire-common-angular-ui-packages.html).

## Cookbook Patterns

- Easy foundation: import `@anarchitects/tailwind` once in the application stylesheet.
- Advanced foundation: import theme, base, and utilities separately to override or omit a layer.
- Product theming: override Tailwind theme variables and ordinary CSS variables in consumer CSS.
- Domain projection: keep slots next to the domain component that gives them meaning.
- Layout composition: keep workflow layout in the domain and route/page shells in the host app.
- Published templates: add an explicit `@source` and verify production CSS generation.
- Accessibility: preserve behavior in Angular while changing its visual implementation.

## Anti-Patterns

- Treating Tailwind as a replacement for Angular behavior.
- Adding an Angular runtime wrapper or JavaScript configuration preset around Tailwind v4.
- Creating generic component wrappers for visual consistency alone.
- Moving domain projection or validation contracts into the CSS package.
- Hiding application shells or audience policy inside a cross-domain layout registry.
- Removing behavioral wrappers without preserving focus, ARIA, interaction, and state semantics.
- Depending on automatic source detection for templates shipped inside npm dependencies.

## Adoption Checklist

- Use `@anarchitects/tailwind` for new styling foundation work after it is published.
- Choose aggregate easy mode or explicit theme/base/utilities advanced mode.
- Register published Angular template locations with `@source`.
- Keep domain-specific slots and runtime behaviors in their Angular domain package.
- Keep generic page/layout composition in the host application.
- Validate theme overrides, dark mode, density, accessibility, and production CSS output.
- Do not add new dependencies on the four retiring Common Angular packages.

## Legacy Package Transition

The packages being retired are:

- `@anarchitects/common-angular-design`
- `@anarchitects/common-angular-ui-composition`
- `@anarchitects/common-angular-ui-layouts`
- `@anarchitects/common-angular-ui-primitives`

They remain available for compatibility while the three release waves complete. After forms and auth no
longer depend on them, their source projects will be removed and their published npm versions will be
deprecated with migration guidance. Published versions will not be unpublished.

The [Legacy Theme Migration Reference](/guides/theme-migration.html) documents the old system for teams
maintaining the final legacy line. A complete consumer migration guide will follow after the Tailwind and
Signal Forms APIs exist.

## Repository Alignment

The package incubates at `libs/common/tailwind` in this repository and is designed for later extraction to
`anarchitecture-community`. `anarchitecture-plugins` may provide Nx setup automation after the public CSS
contract stabilizes. The DDD companion repository aligns on capability and consumption, not necessarily on
physical structure.
