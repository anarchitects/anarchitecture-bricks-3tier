# @anarchitects/auth-declarations

Declaration-only security metadata for auth-aware Nest controllers.

Use this package when a feature/controller brick needs to declare security
intent without depending on the runtime-heavy `@anarchitects/auth-nest`
package.

## Features

- Declare route-level security intent without importing runtime guards or modules
- `@Public()` marks a class or route handler as intentionally public
- `@Policies(...rules)` declares coarse CASL-aligned route policies
- `@AuthorizeResource(...resources)` declares resource-aware policies with an `idParam`
- Convenience aliases `@RequirePermissions(...)` and `@RequireResourceAccess(...)`
- Metadata constants exported for runtime packages that need to read these declarations

## Installation

The commands below target the next minor **after coordinated publication**. See the [verified Nest 11/12 matrix and install recipes](../../../docs/guides/nest.md#verified-support) and [release plan](../../../docs/guides/nest-compatibility-release-plan.md) for current npm versions, migrations and maintenance routing. These runtime packages work in ordinary npm/Yarn/pnpm Nest applications without Nx, the Nest CLI or `@anarchitects/nest`.

```bash
npm install @anarchitects/auth-declarations@^0.12.0
# or
yarn add @anarchitects/auth-declarations@^0.12.0
# or
pnpm add @anarchitects/auth-declarations@^0.12.0
```

Peer dependency for the unreleased 0.12 line: `@nestjs/common ^11.1.6 || ^12.1.2`.
It requires `@anarchitects/auth-ts ^0.12.0`; published 0.11.x remains the prior
Nest 11 maintenance line. Both ESM and CommonJS exports preserve the same public
metadata keys. Explicit `.js` specifiers in declarations enable strict NodeNext
type resolution. The [Auth packed-consumer matrix](../nest/README.md#nest-1112-compatibility-464)
checks both module formats against the host's Nest reflector and real global guards. [Linux CI](https://github.com/anarchitects/anarchitecture-bricks-3tier/actions/runs/38073619350) verified Nest 11.1.6 and 12.1.2 on Node 22.13.0, 24.11.0 and 26.11.1. The combined Auth host excludes Node 20; standalone declarations on Node 20 are not separately certified.

**Breaking dependency requirements:** 0.12 requires Auth TS 0.12 and raises the Nest common floor to 11.1.6 or 12.1.2. There is no public decorator, metadata-key or module-format break, and Nest 11 remains supported. Pair runtime guards with Auth Nest 0.12; do not force the new ranges into the 0.11 maintenance line.

## Usage

```ts
import { AuthorizeResource, Policies, Public } from '@anarchitects/auth-declarations';

@Public()
export class HealthController {}

export class PostsController {
  @Policies({ action: 'update', subject: 'Post' })
  @AuthorizeResource({ action: 'update', subject: 'Post', idParam: 'postId' })
  updatePost() {
    return true;
  }
}
```

`@Policies(...)` is the primary generic authorization declaration. It is a
coarse route pass check and does not prove ownership or other instance-sensitive
rules. Concrete resource authorization belongs to the runtime flow once the
subject instance is available.

Typical pairing:

```ts
import { Module } from '@nestjs/common';
import { AuthModule, provideAuthRuntimeGuards } from '@anarchitects/auth-nest';

@Module({
  imports: [AuthModule.forRoot({})],
  providers: [...provideAuthRuntimeGuards()],
})
export class AppModule {}
```

Controllers declare intent through `@anarchitects/auth-declarations`. Host apps
activate the runtime once, centrally, through `@anarchitects/auth-nest`.

## Exports

- `@Public()` — marks a class or route handler as intentionally public.
- `@Policies(...rules)` — declares coarse CASL-aligned route policies using the existing `{ action, subject }` route policy shape.
- `@AuthorizeResource(...resources)` — declares resource-aware policies with an `idParam`; it is metadata-only and does not bind guards.
- `@RequirePermissions(...permissions)` — convenience alias for `@Policies(...)`.
- `@RequireResourceAccess(...resources)` — convenience alias for `@AuthorizeResource(...)`.
- `AUTH_PUBLIC_METADATA_KEY`, `POLICIES_KEY`, `AUTHORIZE_RESOURCE_KEY` — metadata key constants for runtime packages.
- `RoutePolicy`, `ResourceAuthorizationRoute` — re-exported types.

## Runtime Boundary

This package does not enforce authentication or authorization. It does not
export guards, providers, modules, principal resolution, request-resource
extraction, or app-shell activation helpers.

It also does not export `@AuthorizedResource()`. That helper belongs to the
runtime package because it reads the resource that `auth-nest` attached to the
request after authorization.

Runtime enforcement belongs to `@anarchitects/auth-nest`, which can read this
metadata from controllers and apply the appropriate security behavior.

## Development notes

- `nx build auth-declarations` - build the package.
- `nx test auth-declarations` - run the Vitest unit tests.
