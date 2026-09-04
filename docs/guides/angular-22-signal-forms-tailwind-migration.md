# Angular 22, Signal Forms, and Tailwind v4 Migration Guide

## Scope And Breaking Boundary

Use this guide when moving an application from the final Angular 21/22-compatible legacy line to the
Angular 22-only forms and auth line. The target replaces Reactive Forms integration and the four Common
Angular UI packages while preserving the domain contracts and workflows that still have a clear owner.

The breaking changes are:

- `@anarchitects/forms-angular` and `@anarchitects/auth-angular` now require Angular 22 and NgRx 22
- forms use Angular Signal Forms instead of `FormGroup`, `FormBuilder`, `ValidatorFn[]`, and
  `formControlName`
- styling uses the framework-neutral `@anarchitects/tailwind` Tailwind CSS v4 foundation
- the Common Angular design, composition, layouts, and primitives source projects have been removed
- default form controls are native semantic elements, so DOM structure and visual output can change

The preserved surfaces include `FormConfig`, `SubmissionRequestDTO`, forms selectors and submitted output,
auth DTOs and contract profiles, auth provider helpers, orchestration, and public auth workflows. Forms
continues to own generic capture; a business domain continues to own what a submission means.

## Compatibility And Prerequisites

The target application must use one coherent framework line:

| Dependency family                    | Target                         |
| ------------------------------------ | ------------------------------ |
| Angular framework, router, and forms | `^22.0.0`                      |
| Angular compiler and build tooling   | Angular 22-compatible versions |
| TypeScript                           | `6.x`                          |
| NgRx operators and signals           | `^22.0.0`                      |
| RxJS                                 | `~7.8.0`                       |
| Tailwind CSS                         | `^4.0.0`                       |

Do not combine the Angular 21 compiler with TypeScript 6. The final legacy artifacts remain downloadable
for applications that cannot move yet, but the Signal Forms-based forms and auth packages do not claim
Angular 21 compatibility.

Before:

```json
{
  "dependencies": {
    "@anarchitects/common-angular-design": "...",
    "@anarchitects/common-angular-ui-composition": "...",
    "@anarchitects/common-angular-ui-layouts": "...",
    "@anarchitects/common-angular-ui-primitives": "...",
    "@angular/core": "^21.0.0"
  },
  "devDependencies": {
    "typescript": "~5.9.0"
  }
}
```

After:

```json
{
  "dependencies": {
    "@anarchitects/auth-angular": "^0.9.0",
    "@anarchitects/forms-angular": "^0.7.0",
    "@anarchitects/tailwind": "^0.0.1",
    "@angular/common": "^22.0.0",
    "@angular/core": "^22.0.0",
    "@angular/forms": "^22.0.0",
    "@angular/router": "^22.0.0",
    "@ngrx/operators": "^22.0.0",
    "@ngrx/signals": "^22.0.0",
    "rxjs": "~7.8.0",
    "tailwindcss": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^6.0.0"
  }
}
```

Install the exact forms or auth release selected by the application rather than copying the example's
minimum pre-1.0 range blindly. Pre-1.0 minor releases can contain breaking changes.

## Migration Sequence

1. Upgrade the host to Angular 22, its compatible build/compiler tooling, TypeScript 6, and NgRx 22.
2. Install Tailwind CSS v4 and `@anarchitects/tailwind`; compile the aggregate import before changing UI.
3. Add explicit `@source` entries for the host and every installed package that ships utility classes.
4. Move tokens, themes, density, and base styles from Angular providers to CSS.
5. Move shared composition, runtime layout, and primitives to their new domain or host owners.
6. Upgrade `@anarchitects/forms-angular`, migrate custom validators and advanced form integrations, and
   test payload/reset behavior.
7. Upgrade `@anarchitects/auth-angular`, then re-test every auth form and workflow.
8. Remove the four legacy dependencies and confirm the lockfile and built output no longer contain them.
9. Run production builds and browser flows; development rendering alone does not prove Tailwind source
   detection.

Commit each step independently in a consuming application when practical. Do not remove the legacy
packages until imports, providers, templates, and styles have all moved.

## Package Migration

Before:

```bash
yarn add @anarchitects/common-angular-design \
  @anarchitects/common-angular-ui-composition \
  @anarchitects/common-angular-ui-layouts \
  @anarchitects/common-angular-ui-primitives
```

After:

```bash
yarn remove @anarchitects/common-angular-design \
  @anarchitects/common-angular-ui-composition \
  @anarchitects/common-angular-ui-layouts \
  @anarchitects/common-angular-ui-primitives
yarn add @anarchitects/tailwind tailwindcss
```

Install `@anarchitects/forms-angular` and `@anarchitects/auth-angular` only when the application consumes
those capabilities. The Tailwind package has no Angular runtime, provider, or JavaScript configuration
preset.

## Tailwind Installation And CSS Entry Points

Easy mode imports the complete foundation once in the global application stylesheet:

```css
@import '@anarchitects/tailwind';
```

Advanced mode makes layer ownership explicit:

```css
@import '@anarchitects/tailwind/theme.css';
@import '@anarchitects/tailwind/base.css';
@import '@anarchitects/tailwind/utilities.css';
```

Keep theme before utilities. Omit `base.css` only when the host supplies and validates its own reset and
accessibility baseline. Do not create `tailwind.config.js` merely to wrap these imports; the package is
CSS-first.

### Source Detection

The foundation uses `source(none)` for deterministic production output. `@source` paths are relative to
the stylesheet containing them.

Before, a Tailwind v3-style host might have used JavaScript content configuration:

```js
export default {
  content: ['./src/**/*.{html,ts}'],
};
```

After, register sources in CSS:

```css
@import '@anarchitects/tailwind';

@source './app';
@source '../node_modules/@anarchitects/forms-angular';
@source '../node_modules/@anarchitects/auth-angular';
```

For an Nx workspace whose global stylesheet is under `examples/<app>/src`, use paths that actually reach
the workspace libraries, for example:

```css
@source '../../../libs/forms/angular';
@source '../../../libs/auth/angular';
```

Use complete, static class names. Tailwind cannot discover class fragments assembled at runtime. Build
the production bundle and inspect at least one class from each registered package.

## Design Tokens And Runtime Theme Migration

The design provider previously synchronized TypeScript configuration to DOM attributes.

Before:

```ts
import { provideDesignSystemConfig } from '@anarchitects/common-angular-design/config';
import { applyAnxBaseStyles } from '@anarchitects/common-angular-design/styles';

applyAnxBaseStyles();

export const appConfig = {
  providers: [
    ...provideDesignSystemConfig({
      theme: 'system',
      density: 'comfortable',
      surface: 'default',
    }),
  ],
};
```

After, import the foundation and override its CSS seams:

```css
@import '@anarchitects/tailwind';

@theme {
  --color-anx-accent: oklch(0.72 0.18 145);
  --radius-anx-surface: 1rem;
}

[data-theme='dark'] {
  --anx-color-accent: oklch(0.74 0.16 255);
}
```

Set `data-theme="dark"` and `data-density="compact|comfortable"` on a host-owned root when runtime
switching is required. Tailwind theme variables generate utilities such as `bg-anx-accent`, while the
lower-level `--anx-*` custom properties are the runtime override seam. There is no replacement Angular
injection token because styling state belongs in CSS and the host DOM.

## Slots And Templates Migration

The workspace-wide composition package is gone. Projection now belongs to the Angular domain component
that interprets it.

Before:

```ts
import { AnxSlotDirective } from '@anarchitects/common-angular-ui-composition/projection';
import { AnxTemplateDirective } from '@anarchitects/common-angular-ui-composition/templates';
```

After, for forms-owned composition:

```ts
import { AnarchitectsFormsSlotDirective, AnarchitectsFormsTemplateDirective } from '@anarchitects/forms-angular/ui';
```

The template selectors remain ergonomic, but their names are capability-owned:

```html
<anarchitects-forms-feature-form formId="contact_default">
  <p anxSlot="app-forms-caption-top">How can we help?</p>

  <ng-template anxTemplate="actions">
    <button class="anx-control" type="submit">Send</button>
  </ng-template>
</anarchitects-forms-feature-form>
```

Forms supports `app-forms-page-header`, `app-forms-caption-top`, and
`app-forms-caption-bottom` slots plus `field` and `actions` templates. Do not migrate unrelated host
composition into forms merely to keep using `anxSlot`; use native `ng-content`, `TemplateRef`, and
component inputs in the capability or application that owns the behavior.

## Layouts Migration

The generic layout host, registry, and default renderers are not replaced one-for-one.

Before:

```html
<anarchitects-ui-layout-host kind="form" [layout]="'form:grid'" [model]="formModel" [layoutOptions]="{ columns: 2 }" />
```

After, forms use their domain-owned preset and layout inputs:

```html
<anarchitects-forms-feature-form
  formId="contact_default"
  [pagePreset]="{
    layoutVariant: 'grid',
    columns: 2,
    maxInlineSize: '64rem',
    spacing: 'comfortable',
    actionAlignment: 'end'
  }"
/>
```

`layout` remains available for a forms layout id such as `form:grid`, and `layoutOptions` remains an
advanced forms-owned override. Product page shells, navigation, audience-specific placement, and
non-domain layouts move to host routes/components and ordinary CSS. Reintroduce a generic registry only
after genuine cross-domain behavioral reuse is demonstrated and recorded architecturally.

## Primitives And Accessibility Migration

Generic button, input, card, alert, badge, and spinner wrappers are no longer supplied by a Common
Angular package.

Before:

```html
<anarchitects-ui-card>
  <div anxSlot="content">
    <input anarchitectsUiInput />
  </div>
  <anarchitects-ui-button anxSlot="actions">Save</anarchitects-ui-button>
</anarchitects-ui-card>
```

After, prefer semantic host markup and foundation utilities when no reusable behavior is involved:

```html
<section class="anx-surface anx-stack" aria-labelledby="profile-title">
  <h2 id="profile-title">Profile</h2>
  <input class="anx-control" />
  <button class="anx-control" type="button">Save</button>
</section>
```

If a wrapper owns focus management, ARIA relationships, validation, async state, or interaction, keep or
create it in the relevant domain UI or host application. Tailwind replaces styling infrastructure, not
behavior. Re-check accessible names, keyboard focus, disabled and pending behavior, reduced motion,
error announcements, and contrast after changing markup.

## Signal Forms Migration

### Model And Field Binding

Before, advanced consumers interacted with a nullable Reactive Forms group:

```ts
const group = formComponent.formGroup;
group.get('email')?.setValue('person@example.com');
```

```html
<form [formGroup]="formGroup">
  <input formControlName="email" />
</form>
```

After, `AnarchitectsUiForm` exposes a writable signal model and the generated field tree:

```ts
formComponent.formModel.update((value) => ({
  ...value,
  email: 'person@example.com',
}));

const emailState = formComponent.signalForm()?.email();
```

Custom Signal Forms renderers bind a field tree with `[formField]`:

```html
<input [formField]="signalForm.email" />
```

Applications using `AnarchitectsFeatureForm` normally do not manage the field tree themselves. Continue
passing `FormConfig` indirectly through the forms API, or pass it directly to `AnarchitectsUiForm` in
advanced composition.

### Validation And Schema Extensions

Portable validation remains in `FormConfig`: `required`, `minLength`, `maxLength`, `pattern`, email field
kind, and `validationRules` such as `matchFields`. Host-only validation moves from Reactive Forms
`ValidatorFn[]` to Signal Forms schema extensions.

Before:

```ts
import { ValidatorFn } from '@angular/forms';

const companyEmail: ValidatorFn = (control) => (String(control.value).endsWith('@example.com') ? null : { companyEmail: true });
```

```html
<anarchitects-forms-ui-form [config]="config" [runtimeValidators]="[companyEmail]" />
```

After:

```ts
import { validate } from '@angular/forms/signals';
import type { FormsSchemaExtension } from '@anarchitects/forms-angular/ui';

export const companyEmail: FormsSchemaExtension = (path) => {
  validate(path['email'], ({ value }) => (value().endsWith('@example.com') ? undefined : { kind: 'companyEmail', message: 'Use your company email.' }));
};
```

```html
<anarchitects-forms-ui-form [config]="config" [schemaExtensions]="[companyEmail]" />
```

Use a schema extension only for host-local UI validation. If a rule must be portable across Angular,
Nest, storage, or another consumer, extend the shared forms contract instead. Forms captures values and
emits submissions; it must not absorb business decisions or replace a typed domain API.

### State, Errors, Submission, Reset, And Payload Defaults

The generated field tree exposes Signal Forms state including `touched`, `dirty`, `invalid`, `pending`,
and `errors`. Default rendering shows an error only after the field is touched or dirty. The first error's
message is rendered with `role="alert"`; custom field templates must preserve equivalent behavior.

The submit button is disabled while the form is invalid or pending. A valid submit emits the existing
`SubmissionRequestDTO` shape:

```ts
{
  formId: 'contact_default',
  formVersion: 1,
  payload: {
    email: 'person@example.com',
    subscribe: false,
  },
}
```

Text-like fields now initialize and reset to `''`; booleans initialize and reset to `false`. A successful
submission resets values and field interaction state. Payloads therefore use non-null defaults instead of
the `null` values that could be produced by the previous Reactive Forms implementation. Audit backend
logic, snapshots, analytics, and equality checks that distinguished `null` from an empty string or
`false`.

## Auth Forms Migration

Auth forms compose `AnarchitectsUiForm`, so migrate forms and Tailwind first. Install/import both auth and
forms template sources:

```css
@import '@anarchitects/tailwind';

@source './app';
@source '../node_modules/@anarchitects/auth-angular';
@source '../node_modules/@anarchitects/forms-angular';
```

Existing auth selectors, outputs, DTOs, contract profiles, provider helpers, and state workflows remain.
Host-only Signal Forms extensions pass through auth feature or UI components:

```html
<anarchitects-auth-feature-login [schemaExtensions]="[rejectBlockedAccount]" />
```

The `layout` input now uses the forms-owned `FormsLayoutId`. Replace imports from
`@anarchitects/common-angular-ui-layouts/contracts` with
`@anarchitects/forms-angular/config`. Replace shared projection directive imports with the forms-owned
exports. Re-run register, login, logout, activate, forgot/reset password, verify email, change password,
update email, passkey, and any enabled JWT flows.

## Visual And DOM Migration

Expect visual and selector changes even when a TypeScript contract is unchanged:

- generic Angular wrappers are replaced by native elements or domain components
- legacy `data-anx-*` theme attributes become `data-theme` and `data-density` conventions
- design-provider defaults no longer mutate the document root
- form layout is rendered inside the forms package instead of through a generic layout host
- control values reset to non-null defaults
- focus, invalid, pending, and error styling follows the new semantic tokens and native markup

Update component CSS, DOM queries, screenshot baselines, and end-to-end selectors. Prefer roles, labels,
and stable domain selectors over element nesting or retired wrapper tags.

## FitOverForty Downstream Checklist

[FitOverForty issue #57](https://github.com/anarchitects/fitoverforty/issues/57) is the named downstream
case. Its Angular 22 contact-form browser flow previously proved that the final legacy packages could run
on Angular 22; it does not prove compatibility with the new Signal Forms and Tailwind line.

For FitOverForty:

- align the complete Angular toolchain on Angular 22 and TypeScript 6
- upgrade forms/auth to their Angular 22-only lines
- install `@anarchitects/tailwind` and Tailwind CSS v4
- add explicit app, forms, and auth `@source` paths to the global stylesheet
- migrate provider tokens, runtime layouts, shared projection imports, and primitive wrappers
- verify contact-form required/email/length/cross-field validation, touched/dirty errors, submission,
  non-null payload defaults, and reset behavior
- verify every enabled auth form and production CSS output
- remove all four legacy dependencies and confirm no transitive or source import remains

The issue also records an `@anarchitects/nx-typeorm`/Nx compatibility concern. Track that through the
tooling repository and its supported version, separately from this frontend migration; do not solve it by
retaining the retired Angular UI packages.

## Cross-Repository Follow-Ups

This repository owns the package implementation and local consumer guide. The ecosystem documents define
these coordination boundaries:

| Repository                  | Follow-up                                                                                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `anarchitecture-meta`       | Record a scheduled ownership move and update ecosystem mappings; meta owns landscape contracts, not runtime implementation.                           |
| `anarchitecture-community`  | Accept the framework-neutral Tailwind package after its CSS contract and compatibility fixtures are stable, preserving package name and entry points. |
| `anarchitecture-plugins`    | Consider optional Nx installation/source-detection automation after the public contract stabilizes; plugins do not own the CSS contract.              |
| `anarchitecture-bricks-ddd` | Align the frontend-foundation and forms capabilities and keep a traceable migration path without forcing identical package structure.                 |

These are coordination requirements, not changes authorized by this guide. The two bricks repositories
remain companion implementation styles aligned on domain intent, public capability surface, contract
ownership, and migration expectations.

## Validation And Removal Checklist

- [ ] Angular 22 and TypeScript 6 compile without an Angular compiler version error.
- [ ] Forms/auth package peer requirements install without warnings.
- [ ] Tailwind easy or advanced imports compile in a production build.
- [ ] Host, forms, and auth sources produce their expected utility classes.
- [ ] Theme overrides, dark mode, density, keyboard focus, reduced motion, and contrast are checked.
- [ ] Required, email, length, pattern, and cross-field validation behave as expected.
- [ ] Touched/dirty error visibility and pending/disabled behavior are checked.
- [ ] Submission emits the expected DTO; successful reset uses `''` and `false`, never `null`.
- [ ] Custom `field` and `actions` templates preserve labels, ARIA, errors, and form submission.
- [ ] All enabled auth forms and browser workflows pass.
- [ ] No source import, package dependency, or lockfile entry remains for the four retired packages.
- [ ] Visual snapshots and selectors are updated for native/domain-owned markup.

Published legacy artifacts remain downloadable. npm deprecation is a separate, explicitly approved
operation and must point consumers to this guide and `@anarchitects/tailwind`; packages must never be
unpublished.

## Related Decisions And Guides

- [ADR-0003: Adopt Tailwind v4 and retire Common Angular UI packages](../adr/0003-adopt-tailwind-v4-frontend-foundation-and-retire-common-angular-ui-packages.md)
- [ADR-0004: Define Common as platform foundation](../adr/0004-define-common-as-platform-foundation-not-shared-dumping-ground.md)
- [ADR-0005: Define Forms as configurable intake](../adr/0005-define-forms-as-configurable-intake-domain.md)
- [ADR-0006: Forms must not replace typed domain APIs](../adr/0006-forms-must-not-replace-domain-apis.md)
- [ADR-0008: Forms must prefer events over embedded business logic](../adr/0008-forms-event-driven-extension.md)
- [Frontend Foundation Guide](design-ui-systems.md)
- [Angular 22 and TypeScript 6 workspace notes](angular-22-migration.md)
- [Legacy Common Angular theme reference](theme-migration.md)
- [Migration to `anarchitecture-bricks-ddd`](migration-to-bricks-ddd.md)
