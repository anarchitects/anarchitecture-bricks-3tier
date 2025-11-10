# @anarchitects/auth-angular/config

Configuration helpers and Angular DI tokens for the auth domain. Import from `@anarchitects/auth-angular/config` to customize how the data-access layer resolves API URLs.

## Exports

- `AUTH_CONFIG` / `AuthConfig`: typed configuration describing the auth API resource path
- `API_RESOURCE_PATH`: resolved string token used by the data-access `AuthApi`
- `provideAuthConfig(config)`: helper that registers `AUTH_CONFIG` and `API_RESOURCE_PATH`
- `provideAuthDefaults()`: registers the library defaults (`apiResourcePath: 'auth'`)
- `injectAuthConfig()` and `injectApiResourcePath()`: convenience accessors with sane fallbacks

## Usage

```ts
import { ApplicationConfig } from '@angular/core';
import { provideAuthConfig } from '@anarchitects/auth-angular/config';

export const appConfig: ApplicationConfig = {
  providers: [
    ...provideAuthConfig({
      apiResourcePath: 'identity/auth',
    }),
  ],
};
```

Register these providers once (e.g. in `bootstrapApplication`) so all dependent layers resolve the correct API base path.
