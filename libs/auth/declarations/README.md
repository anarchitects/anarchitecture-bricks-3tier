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

```bash
npm install @anarchitects/auth-declarations
# or
yarn add @anarchitects/auth-declarations
# or
pnpm add @anarchitects/auth-declarations
```

Peer dependency: `@nestjs/common ^11.0.0`

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
