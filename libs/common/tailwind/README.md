# @anarchitects/tailwind

Framework-neutral Tailwind CSS v4 defaults for Anarchitects applications. The package provides a small,
overridable visual foundation; it does not provide components, an Angular runtime wrapper, or a legacy
`tailwind.config.*` preset.

## Features

- CSS-only, framework-neutral Tailwind v4 foundation.
- Aggregate easy mode plus independently composable theme, base, and utility entry points.
- Semantic design tokens with runtime dark-theme and density seams.
- Accessibility-minded base styles and a small set of capability-oriented utilities.

## Installation

```bash
yarn add @anarchitects/tailwind tailwindcss
```

Use Tailwind v4's official Vite, PostCSS, or CLI integration in the consuming application. Tailwind is a
peer dependency so the consumer owns its build-tool integration and version within the supported v4 line.

## Usage

### Easy mode

Import the aggregate entry point once in the application's global stylesheet:

```css
@import '@anarchitects/tailwind';
```

This loads the theme, accessibility-minded base rules, Tailwind utilities, and Anarchitects utilities in
the required order.

### Advanced mode

Import only the layers the application wants to use or replace:

```css
@import '@anarchitects/tailwind/theme.css';
@import '@anarchitects/tailwind/base.css';
@import '@anarchitects/tailwind/utilities.css';
```

Omit `base.css` when the host owns its reset. Keep theme before utilities so token-driven utilities are
available during compilation.

## Configuration

### Token overrides

Theme variables generate Tailwind utilities such as `bg-anx-accent`, `text-anx-foreground`,
`rounded-anx-control`, and `font-anx-sans`. Override them after importing the foundation:

```css
@import '@anarchitects/tailwind';

@theme {
  --color-anx-accent: oklch(0.72 0.18 145);
  --radius-anx-surface: 1rem;
}
```

The lower-level `--anx-*` custom properties are the runtime theme seam. Override them in ordinary
selectors when a value must change at runtime:

```css
[data-theme='dark'] {
  --anx-color-accent: oklch(0.74 0.16 255);
}
```

### Theme and density conventions

- `data-theme="dark"` activates dark semantic values and the `dark:` variant.
- `data-density="compact"` activates compact spacing/control values and the `compact:` variant.
- `data-density="comfortable"` activates comfortable values and the `comfortable:` variant.
- Without these attributes, the light/default-density values apply.

The foundation includes reusable `anx-stack`, `anx-cluster`, `anx-control`, `anx-surface`, and
`anx-focus-ring` utilities. These are styling infrastructure, not behavioral component contracts.

### Source detection

The foundation opts out of automatic workspace detection with `source(none)` so production output is
deterministic. Register the consumer application and every published package whose templates contain
utility classes. `@source` paths are relative to the stylesheet where they appear, so adjust the examples
for the consumer's layout.

Installed packages:

```css
@import '@anarchitects/tailwind';
@source '../node_modules/@anarchitects/forms-angular';
@source '../node_modules/@anarchitects/auth-angular';
```

Workspace library sources:

```css
@import '@anarchitects/tailwind';
@source '../../../libs/forms/angular';
@source '../../../libs/auth/angular';
```

Consumer paths that automatic detection does not cover:

```css
@import '@anarchitects/tailwind';
@source './app';
@source './features';
```

Prefer static, complete utility class names in templates. Tailwind cannot detect dynamically assembled
class fragments.

### Accessibility baseline

The base layer supplies visible keyboard focus, reduced-motion behavior, inherited control typography,
semantic foreground/background defaults, and correct handling of `hidden` and disabled states. Angular or
other framework components still own ARIA semantics, focus management, validation, and interaction.

## Exports

| Entry point                            | Purpose                                      |
| -------------------------------------- | -------------------------------------------- |
| `@anarchitects/tailwind`               | Aggregate easy mode                          |
| `@anarchitects/tailwind/theme.css`     | Theme tokens and runtime semantic properties |
| `@anarchitects/tailwind/base.css`      | Preflight and accessible baseline rules      |
| `@anarchitects/tailwind/utilities.css` | Tailwind and Anarchitects utilities/variants |

## Repository ownership

This package incubates in `anarchitecture-bricks-3tier` while Storybook, Angular packages, and examples
prove the CSS contract. It intentionally remains framework-neutral so it can later move to
`anarchitecture-community` without changing its package name or public entry points.

See [ADR-0003](https://github.com/anarchitects/anarchitecture-bricks-3tier/blob/main/docs/adr/0003-adopt-tailwind-v4-frontend-foundation-and-retire-common-angular-ui-packages.md)
and [ADR-0004](https://github.com/anarchitects/anarchitecture-bricks-3tier/blob/main/docs/adr/0004-define-common-as-platform-foundation-not-shared-dumping-ground.md).
Applications moving from the retired Common Angular UI packages should follow the
[Angular 22, Signal Forms, and Tailwind v4 migration guide](../../../docs/guides/angular-22-signal-forms-tailwind-migration.md).

## Nx targets

```bash
yarn nx run tailwind:lint --skip-nx-cache
yarn nx run tailwind:test --skip-nx-cache
yarn nx run tailwind:build --skip-nx-cache
yarn nx run tailwind:typecheck --skip-nx-cache
yarn nx run tailwind:package --skip-nx-cache
```
