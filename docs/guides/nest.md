# Nest Guide

## Intent

This is the Nest implementation cookbook for Anarchitecture Bricks. It focuses on backend module composition and entry-point usage, while shared cross-stack contracts stay canonical in:

- [TS Contracts Guide](/guides/ts-contracts.html)
- [Design/UI Systems Guide](/guides/design-ui-systems.html)

## Architecture

- Nest libraries follow: `presentation -> application <- infrastructure`.
- Shared contracts (DTOs/models/schemas) are consumed from TS packages (`@anarchitects/forms-ts`, `@anarchitects/auth-ts`).
- Domain libraries expose both facade composition modules and layer-specific secondary entry points.
- Controllers keep `@RouteSchema` pure and imported from TS contract libraries.
- OpenAPI metadata is assigned centrally in specs tooling.

## Easy Mode with Composition Modules

Use facade composition modules for the default host-app path:

```ts
import { Module } from '@nestjs/common';
import { FormsModule } from '@anarchitects/forms-nest';
import { AuthModule } from '@anarchitects/auth-nest';

@Module({
  imports: [
    FormsModule.forRoot({}),
    FormsModule.forRootFromConfig(),
    AuthModule.forRoot({}),
    AuthModule.forRootFromConfig(),
  ],
})
export class AppModule {}
```

Easy mode is preferred when teams want predictable integration and minimal Nest wiring.

## Advanced Mode with Layer Entry Points

Use layered entry points when you need explicit control over domain composition:

- `@anarchitects/forms-nest/application`
- `@anarchitects/forms-nest/presentation`
- `@anarchitects/forms-nest/infrastructure-*`
- `@anarchitects/forms-nest/config`
- `@anarchitects/auth-nest/application`
- `@anarchitects/auth-nest/presentation`
- `@anarchitects/auth-nest/infrastructure-*`
- `@anarchitects/auth-nest/config`

Advanced mode is for replacing adapters, customizing policy wiring, or composing only selected layers while preserving facade compatibility.

## TS Contract Integration

Contract ownership is TS-first:

- Forms contracts in `@anarchitects/forms-ts`
- Auth contracts in `@anarchitects/auth-ts`

Nest libraries (`@anarchitects/forms-nest`, `@anarchitects/auth-nest`) map these contracts in presentation/application layers and keep schemas synchronized for OpenAPI generation. Ownership and compatibility policy are defined in [TS Contracts Guide](/guides/ts-contracts.html).

## Library Entry Point Cookbook

- Fast start:
  use root module imports (`@anarchitects/forms-nest`, `@anarchitects/auth-nest`) with `forRoot` or `forRootFromConfig`.
- Config-driven environments:
  prefer `forRootFromConfig` with typed `registerAs` config.
- Adapter override:
  keep facade contract stable, then replace only targeted `infrastructure-*` pieces through secondary entry points.
- Partial composition:
  combine `application` and selected `presentation`/`infrastructure-*` modules when host apps need strict control.

## Schema Evolution and Compatibility

- Introduce additive fields before removals.
- Keep backward-compatible schema keys during migration windows.
- Coordinate TS + Nest + Angular updates in one change when compatibility risk exists.
- Preserve stable contracts required by frontend composition and runtime layout behavior.

## Contract Verification Workflow

- Validate that controller schemas import TS contracts (no inline drift).
- Run OpenAPI generation and inspect diffs for compatibility impact.
- Verify Angular consumers (`@anarchitects/forms-angular`, `@anarchitects/auth-angular`) against updated contracts.
- Run docs quality checks:
  `yarn nx run docs-hub:validate-content`, `yarn nx run docs-hub:build`, `yarn nx run docs-hub:verify`.

## Common Pitfalls

- Treating Nest libraries as contract owners instead of TS consumers.
- Skipping facade modules and jumping to layer entry points for simple use cases.
- Defining inline route schemas instead of importing TS DTO schemas.
- Mixing persistence internals across domain boundaries.
- Introducing schema changes without verifying cross-stack consumer impact.
