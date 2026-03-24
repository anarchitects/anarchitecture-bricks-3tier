# Angular Guide

## Intent

This is the Angular implementation cookbook for Anarchitecture Bricks. It focuses on practical Angular setup and consumption patterns, while shared design/runtime guidance and TS contract ownership stay canonical in:

- [Design/UI Systems Guide](/guides/design-ui-systems.html)
- [TS Contracts Guide](/guides/ts-contracts.html)

## Architecture

- Angular libraries follow `ui <- feature -> state -> data-access`.
- `config` and `util` are shared helpers available across layers.
- TS contracts are consumed from domain TS packages; Angular layers do not redefine ownership contracts.
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

Contract ownership remains in TS packages:

- Forms contracts: `@anarchitects/forms-ts`
- Auth contracts: `@anarchitects/auth-ts`

Angular consumers (`@anarchitects/forms-angular`, `@anarchitects/auth-angular`) map TS contracts in `data-access` and `state`, then expose stable UI/feature APIs. For contract ownership, change workflow, and compatibility policy, follow [TS Contracts Guide](/guides/ts-contracts.html).

## Layout Cookbook

- Configure layout runtime through `@anarchitects/common-angular-ui-layouts`.
- Use explicit layout input when route behavior must be deterministic.
- Set defaults with `provideAnxLayoutDefaults(...)`.
- Register custom layout renderers with `provideAnxLayouts([...])`.
- Keep design/runtime layout contract definitions centralized in [Design/UI Systems Guide](/guides/design-ui-systems.html).

## State/Data Access

- Keep HTTP and endpoint adapters in `data-access`.
- Keep stateful orchestration and derived UI signals in `state`.
- Keep `feature` as composition/orchestration and `ui` as presentational/token-driven.
- Sync backend schema changes by regenerating OpenAPI and updating Angular adapters before merge.

## Auth CASL Guidance

For `@anarchitects/auth-angular`, keep the authorization split explicit:

- `@anarchitects/auth-ts` owns the serialized auth rule shape
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
- Treating TS contracts as Angular-owned instead of TS-owned.
- Skipping OpenAPI/client sync after schema changes.
