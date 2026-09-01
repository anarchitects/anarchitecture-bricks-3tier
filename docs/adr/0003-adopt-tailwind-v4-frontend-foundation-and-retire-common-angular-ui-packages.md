# ADR-0003: Adopt Tailwind v4 As The Frontend Foundation And Retire Common Angular UI Packages

- Status: Accepted
- Date: 2026-09-01
- Deciders: Anarchitects maintainers
- Epic: [#362](https://github.com/anarchitects/anarchitecture-bricks-3tier/issues/362)

## Context

The current shared Angular UI system distributes styling and composition across four packages:

- `@anarchitects/common-angular-design`
- `@anarchitects/common-angular-ui-composition`
- `@anarchitects/common-angular-ui-layouts`
- `@anarchitects/common-angular-ui-primitives`

Together they provide tokens, base styles, projection conventions, runtime-selectable layouts, and
generic Angular components. That layering is more infrastructure than most consumers need, couples
styling conventions to Angular, and makes host-level customization harder than direct composition.

Anarchitects is adopting Tailwind CSS v4 as its default styling foundation. Tailwind v4 supports
CSS-first theme variables, regular CSS imports, custom utilities, and explicit source registration.
This permits a shared foundation without a JavaScript configuration preset or Angular runtime wrapper.

At the same time, Angular 22 and Signal Forms work will change the forms and auth UI capabilities.
The transition needs to distinguish styling infrastructure from framework behavior so that Tailwind is
not treated as a replacement for Angular components, projection, validation, state, or accessibility.

## Decision

### Framework-neutral Tailwind foundation

Create `@anarchitects/tailwind` at `libs/common/tailwind` as a framework-neutral, publishable CSS
package. It will use Tailwind v4 CSS-first configuration only. It must not expose an Angular provider,
runtime theme service, JavaScript `tailwind.config.*` preset, or component wrapper layer.

The public CSS contract will offer both consumption modes:

- easy mode: `@import "@anarchitects/tailwind";`
- advanced theme: `@import "@anarchitects/tailwind/theme.css";`
- advanced base: `@import "@anarchitects/tailwind/base.css";`
- advanced utilities: `@import "@anarchitects/tailwind/utilities.css";`

Easy mode composes the three advanced entry points in their required layer order. Advanced mode lets a
consumer omit or replace a layer, including opting out of the Anarchitects base rules. Theme tokens use
Tailwind v4 `@theme`; reusable utilities and variants remain CSS-defined. Consumers document explicit
`@source` paths for packaged Angular templates because dependencies are not assumed to be scanned.

The foundation provides defaults in the Anarchitects mindset, not a fixed brand. Consumers can override
theme variables, compose their own components, and choose which base and utility layers to import.

### Capability ownership

| Existing capability                                                  | Target owner                                                                                | Retained behavior                                                              | Retired abstraction                                                          |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Design tokens, theme defaults, density/dark-mode styling conventions | `@anarchitects/tailwind/theme.css` and consumer CSS                                         | CSS variables and utility-generating theme tokens remain overridable           | Angular injection tokens and runtime design-system configuration for styling |
| Base styles and shared shell utilities                               | `@anarchitects/tailwind/base.css` and `utilities.css`                                       | Accessible defaults, layout utilities, and semantic CSS conventions            | Package-author JavaScript contracts that police styling class names          |
| Composition slots and templates                                      | The Angular domain capability that renders them; native Angular projection/template APIs    | Necessary slots remain close to forms, auth, or another owning workflow        | A workspace-wide composition schema and generic slot package                 |
| Runtime form/list/detail layouts                                     | The owning domain Angular feature, or the host app for page/shell composition               | Runtime selection may remain where it is a real domain requirement             | A generic cross-domain layout registry, host, and default-renderer package   |
| Buttons, fields, surfaces, and feedback primitives                   | Domain Angular UI for behavior-bearing controls; host applications for general presentation | Required interaction, semantics, focus, validation, and accessibility behavior | A general-purpose Anarchitects Angular primitive wrapper layer               |
| Form layout and validation presentation                              | `@anarchitects/forms-angular`                                                               | Form-specific projection, errors, state, and submission behavior               | Reliance on Common Angular composition/layout/primitives packages            |
| Auth form presentation                                               | `@anarchitects/auth-angular` through `forms-angular` where appropriate                      | Auth contracts and workflows                                                   | Direct dependencies on Common Angular UI infrastructure                      |

Tailwind replaces styling infrastructure. It does **not** replace Angular behavior. TypeScript logic,
signals, forms, content projection, focus management, ARIA semantics, routing, and orchestration remain in
Angular domain libraries or consuming applications.

### Capability-first boundaries

Shared UI behavior moves to the capability that needs it instead of to an audience-specific or generic UI
package. For example, form layout behavior belongs to `forms-angular`; whether a page is public or admin
remains a host-application composition decision. A new shared behavioral package requires demonstrated
cross-domain reuse and a separate architecture decision.

### Repository ownership and extraction

`@anarchitects/tailwind` incubates in this repository so the Angular packages, Storybook, and examples can
prove its public contract together. It is designed for later extraction to `anarchitecture-community`,
which owns independently publishable, framework-neutral community support packages.

Extraction is considered after the CSS API and compatibility fixtures are stable. It should preserve the
package name and public entry points. The ecosystem ownership change must be reflected in
`anarchitecture-meta`. `anarchitecture-plugins` may later own Nx generators or checks that install and
configure the published package, but it does not own the CSS contract. `anarchitecture-bricks-ddd` should
align on the capability and consumption contract without duplicating Angular behavior or requiring an
identical directory structure.

### Deprecation and release sequence

The transition is intentionally staged:

1. Publish a final compatible line of existing Angular packages that supports Angular 21 and 22 where
   proven.
2. Publish and validate `@anarchitects/tailwind` while all four legacy packages remain available and are
   not yet npm-deprecated.
3. Migrate `forms-angular` to Angular 22 Signal Forms and Tailwind, then migrate `auth-angular`.
4. Confirm no workspace imports or dependencies remain before removing the four legacy source projects.
5. After human acceptance, deprecate all published versions of the four legacy packages on npm with a
   message pointing to `@anarchitects/tailwind` and the migration guide.

Published legacy versions must never be unpublished. Their tags, changelogs, artifacts, and migration
history remain available. npm deprecation is a separately approved release operation, not a side effect of
source removal.

## Compatibility And Migration Consequences

- The final legacy line can claim Angular 21/22 compatibility only where packaging and consumer fixtures
  prove both majors.
- Signal Forms-based `forms-angular` and the dependent `auth-angular` line require Angular 22 and receive
  pre-1.0 minor releases because their public forms APIs and presentation change.
- Consumers move styling tokens to Tailwind theme variables and replace Angular runtime styling config
  with CSS and host selectors.
- Consumers add `@source` for packaged templates that contain Tailwind classes and validate production CSS
  generation, not only development rendering.
- Consumers move generic layouts and page shells into application composition; domain-specific runtime
  layout behavior stays in its domain package.
- Visual output can change even where TypeScript contracts remain stable. Migration notes must identify
  token, reset, density, dark-mode, layout, focus, and validation-state differences.
- Accessibility remains an acceptance criterion of behavior-bearing Angular UI and consumer composition;
  utility classes alone do not satisfy it.

## Consequences

### Positive

- styling becomes framework-neutral and directly overridable
- easy and advanced consumption remain available without a runtime wrapper
- behavioral ownership follows domain capabilities
- the foundation can later serve consumers outside Angular and outside this repository
- fewer generic Angular layers reduce coupling during the Signal Forms migration

### Trade-offs

- consumers must understand Tailwind source detection and CSS layer ordering
- applications own more page-level composition and general-purpose visual choices
- moving from runtime TypeScript theme configuration to CSS can require host changes
- the staged transition temporarily supports both the legacy and target foundations
- cross-repo extraction requires coordinated documentation and release ownership

## Follow-Up Coordination

- `anarchitecture-meta`: record the package ownership transition when extraction is scheduled
- `anarchitecture-community`: accept the framework-neutral package after incubation criteria are met
- `anarchitecture-plugins`: consider optional Nx setup automation only after the CSS contract stabilizes
- `anarchitecture-bricks-ddd`: align frontend-foundation capability and migration guidance

These are coordination requirements under epic #362. This ADR does not create or authorize work in
other repositories.

## Related

- [Frontend Foundation Guide](../guides/design-ui-systems.md)
- [Legacy Theme Migration Reference](../guides/theme-migration.md)
- [ADR-0001: Align With `anarchitecture-bricks-ddd` And Support Migration](0001-align-with-bricks-ddd-and-support-migration.md)
- [ADR-0002: Do Not Split Libraries By Audience Until Workflow Divergence Is Real](0002-do-not-split-libraries-by-audience-until-workflow-divergence-is-real.md)
- [Anarchitecture Meta: Ecosystem Model](https://github.com/anarchitects/anarchitecture-meta/blob/main/ECOSYSTEM-MODEL.md)
- [Anarchitecture Meta: `anarchitecture-community` role](https://github.com/anarchitects/anarchitecture-meta/blob/main/repos/anarchitecture-community.md)
- [Tailwind CSS: Theme variables](https://tailwindcss.com/docs/theme)
- [Tailwind CSS: Detecting classes in source files](https://tailwindcss.com/docs/detecting-classes-in-source-files)
