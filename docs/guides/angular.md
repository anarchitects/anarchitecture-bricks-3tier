# Angular Guide

## Intent

This is the Angular implementation cookbook for Anarchitecture Bricks. It focuses on practical Angular setup and consumption patterns, with shared design/runtime guidance and HTTP ownership explained in:

- [Frontend Foundation Guide](/guides/design-ui-systems.html)
- [TS Contracts Guide](/guides/ts-contracts.html)
- [Angular 22 and TypeScript 6 Migration Notes](/guides/angular-22-migration.html)
- [Angular 22, Signal Forms, and Tailwind v4 Migration Guide](/guides/angular-22-signal-forms-tailwind-migration.html)

## Architecture

- Angular libraries follow `ui <- feature -> state -> data-access`.
- `config` and `util` are shared helpers available across layers.
- Shared public HTTP contracts belong to `anarchitecture-contracts`; current local TS DTO imports remain transitional. Angular layers do not independently author wire schemas.
- State scope stays explicit through provider helpers (no implicit global singleton state).

## Easy Mode with Root Exports

Use root package exports for fastest onboarding and lowest host-app wiring cost:

```ts
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideFormsFeature } from '@anarchitects/forms-angular';
import { provideAuthFeature } from '@anarchitects/auth-angular';

export const appConfig = {
  providers: [provideHttpClient(withFetch()), ...provideFormsFeature(), ...provideAuthFeature()],
};
```

Easy mode is the default for product teams that want stable integration points with minimal setup decisions.

## Advanced Mode with Secondary Entry Points

Use layer-specific entry points when you need targeted overrides:

- `@anarchitects/forms-angular/config`
- `@anarchitects/forms-angular/data-access`
- `@anarchitects/forms-angular/state`
- `@anarchitects/forms-angular/feature`
- `@anarchitects/forms-angular/ui`
- `@anarchitects/forms-angular/util`
- `@anarchitects/auth-angular/config`
- `@anarchitects/auth-angular/data-access`
- `@anarchitects/auth-angular/state`
- `@anarchitects/auth-angular/feature`
- `@anarchitects/auth-angular/ui`
- `@anarchitects/auth-angular/util`

Use advanced mode for custom transport adapters, scoped state lifecycles, or domain-specific feature composition without breaking the easy root-consumption path.

## TS Contract Integration

Public HTTP ownership belongs to `anarchitecture-contracts`, using Zod-first wire
schemas, operation definitions and deterministic generated OpenAPI 3.1. Angular
clients adopt the same immutable contract version as the verified backend; current
`@anarchitects/forms-ts`, `@anarchitects/auth-ts`, Identity and Newsletter DTO imports
remain the transitional baseline until that migration is implemented.

Keep transport mapping in `data-access`, orchestration in `state` and stable UI/feature
APIs. Domain models and `auth-ts` policy semantics stay local. Follow the
[TS Contracts Guide](/guides/ts-contracts.html) for compatibility and adoption gates;
local generated clients and Prism checks alone do not establish canonical conformance.

## Layout Cookbook

For new work, keep domain-specific layout behavior in the Angular domain capability and compose route/page
shells in the host application. Use Tailwind utilities for styling; do not introduce a generic runtime
layout registry merely to select CSS arrangements.

The legacy Common Angular layout source has been removed under
[ADR-0003](/adr/0003-adopt-tailwind-v4-frontend-foundation-and-retire-common-angular-ui-packages.html).
Published versions remain downloadable for migration only. Follow the
[Frontend Foundation Guide](/guides/design-ui-systems.html) for current ownership.

## Batteries-Included Forms Pages

The preferred route-based forms page path uses `AnarchitectsFeatureForm` with a forms page preset and
optional header inputs. This gives a production-ready contact-form style page with no required
consumer CSS patching for the primary use case.

```ts
import { Component } from '@angular/core';
import { AnarchitectsFeatureForm } from '@anarchitects/forms-angular/feature';

@Component({
  selector: 'app-contact-form-route',
  imports: [AnarchitectsFeatureForm],
  template: `
    <anarchitects-forms-feature-form
      [formId]="'contact_default'"
      [formVersion]="1"
      [pagePreset]="{
        layoutVariant: 'stacked',
        maxInlineSize: '42rem',
        spacing: 'comfortable',
        actionAlignment: 'end',
      }"
      [pageTitle]="'Contact us'"
      [pageCaption]="'Get in touch and we will respond as soon as possible.'"
    />
  `,
})
export class ContactFormRoute {}
```

This easy-mode path covers the common scenario:

- semantic page title/caption rendering
- readable centered max width
- spacing and action layout defaults from the forms preset contract
- no wrapper component required

### Advanced Composition With Slots

When you need richer page copy, project custom regions into the form component.

- `app-forms-page-header`: replaces the built-in title/subtitle/caption header
- `app-forms-caption-top`: renders one or more caption blocks above the form
- `app-forms-caption-bottom`: renders one or more caption blocks below the form

```html
<anarchitects-forms-feature-form [formId]="'contact_default'" [formVersion]="1" [pageTitle]="'Support request'">
  <p anxSlot="app-forms-caption-top">Product support and onboarding</p>
  <p anxSlot="app-forms-caption-top">Billing and enterprise assistance</p>

  <p anxSlot="app-forms-caption-bottom">Typical response in one business day</p>
  <p anxSlot="app-forms-caption-bottom">Priority requests are triaged continuously</p>
</anarchitects-forms-feature-form>
```

Use inputs and presets for routine cases. Use slot projection when you need multiple caption blocks or
fully custom introductory content.

## State/Data Access

- Keep HTTP and endpoint adapters in `data-access`.
- Keep stateful orchestration and derived UI signals in `state`.
- Keep `feature` as composition/orchestration and `ui` as presentational/token-driven.
- Coordinate HTTP changes through reviewed canonical contract versions; verify Angular adapters/generated clients and backend conformance together, retaining baseline checks during transition.

## Auth CASL Guidance

For `@anarchitects/auth-angular`, keep the authorization split explicit:

- `@anarchitects/auth-ts` owns policy semantics; Contracts owns the HTTP representation, mapped without loss
- `policyGuard` is a coarse route-attempt check over `{ action, subject }`
- `resourcePolicyGuard` is for resolved-resource routes
- `canAccessResource(...)` and `canAccessResourceField(...)` are for concrete UI/resource checks

Do not treat Angular route metadata as full instance-level authorization. If the app has not loaded the resource yet, the Angular side can only make the coarse "attempt" decision. Nest still remains the final enforcement boundary for instance-sensitive access.

## Testing and Docs Workflow

- Unit-test `state` and `feature` layers independently of primitive visuals.
- Run docs quality checks:
  `yarn nx run docs-hub:validate-content`,
  `yarn nx run docs-hub:build`,
  `yarn nx run docs-hub:verify`.
- Run contract-aligned flows for forms/auth after TS or API changes.

## Common Pitfalls

- Bypassing root exports for routine use cases and over-fragmenting app setup.
- Coupling UI components directly to transport concerns instead of `data-access`.
- Using internal source imports instead of published entry points.
- Treating Angular or local TS DTOs as canonical public HTTP contract owners.
- Skipping OpenAPI/client sync after schema changes.

## Newsletter integration

See [Newsletter integration](/guides/newsletter-integration.html) for both provider examples, Forms-backed signup, OpenAPI and browser/database regression. The [migration guide](/guides/newsletter-migration.html) separates reusable capabilities from host policy and app-local data migration.
