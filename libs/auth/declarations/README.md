# @anarchitects/auth-declarations

Declaration-only security metadata for auth-aware Nest controllers.

Use this package when a feature/controller brick needs to declare security
intent without depending on the runtime-heavy `@anarchitects/auth-nest`
package.

## Public API

- `@Public()` marks a class or route handler as intentionally public.
- `@Policies(...rules)` declares coarse CASL-aligned route policies using the existing `{ action, subject }` route policy shape.
- `@AuthorizeResource(...resources)` declares resource-aware policies with an `idParam`; it is metadata-only and does not bind guards.
- `@RequirePermissions(...permissions)` is a convenience alias for `@Policies(...)`.
- `@RequireResourceAccess(...resources)` is a convenience alias for `@AuthorizeResource(...)`.
- Metadata constants are exported for runtime packages that need to read these declarations.

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

## Runtime Boundary

This package does not enforce authentication or authorization. It does not
export guards, providers, modules, principal resolution, request-resource
extraction, or app-shell activation helpers.

Runtime enforcement belongs to `@anarchitects/auth-nest`, which can read this
metadata from controllers and apply the appropriate security behavior.

## Scripts

- `nx build auth-declarations` - build the package.
- `nx test auth-declarations` - run the Vitest unit tests.
