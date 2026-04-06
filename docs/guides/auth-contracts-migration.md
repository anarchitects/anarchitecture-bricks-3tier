# Auth Contract Migration Guide

## Intent

This guide covers the move from hard-coded auth DTO request schemas to the contract-driven auth profile model shared by `@anarchitects/auth-ts`, `@anarchitects/auth-nest`, and `@anarchitects/auth-angular`.

Use this guide when a consumer needs to customize auth field requirements, length limits, or empty-string handling without forking package code.

## What Changed

Before this shift, auth request behavior was effectively fixed by static DTO request schema exports such as:

- `RegisterRequestSchema`
- `LoginRequestSchema`
- `ForgotPasswordRequestSchema`
- `ResetPasswordRequestSchema`
- `VerifyEmailRequestSchema`
- `ChangePasswordRequestSchema`

Those exports still exist, but they are now default-profile convenience helpers built from `DefaultAuthContractConfig`.

The new integration seam is the contract profile model:

- `AuthContractConfig`
- `DefaultAuthContractConfig`
- `createAuthContracts(...)`
- `assertContractCompatibility(...)`
- `shapeAuthPayload(...)`

This is the important behavioral change:

- use static DTO schema exports when the published default profile is enough
- use `createAuthContracts(...)` when validation or form behavior must be customized

## Export Surface Changes

### Newly important exports

Use these exports as the new source of truth for profile-driven auth behavior:

| Package                             | Export                                        | Purpose                                                          |
| ----------------------------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| `@anarchitects/auth-ts`             | `AuthContractConfig`                          | Type the contract profile                                        |
| `@anarchitects/auth-ts`             | `DefaultAuthContractConfig`                   | Published default profile                                        |
| `@anarchitects/auth-ts`             | `createAuthContracts(...)`                    | Generate request schemas and form metadata                       |
| `@anarchitects/auth-ts`             | `assertContractCompatibility(...)`            | Fail fast on unexpected profile versions                         |
| `@anarchitects/auth-ts`             | `shapeAuthPayload(...)`                       | Apply `emptyStringPolicy` before submit                          |
| `@anarchitects/auth-nest`           | `AuthModule.forRoot({ contracts })`           | Override backend validation profile                              |
| `@anarchitects/auth-nest`           | `AuthModule.forRootFromConfig({ contracts })` | Override backend validation while other options come from config |
| `@anarchitects/auth-angular/config` | `provideAuthContracts(...)`                   | Override frontend form and submit-shaping profile                |

### Removed or renamed exports

No core auth DTO type aliases were removed or renamed as part of this migration.

- `LoginRequestDTO`, `RegisterRequestDTO`, and the other request DTO types remain valid.
- Static schema exports such as `LoginRequestSchema` also remain valid.
- The migration is about which exports you should treat as the customization seam, not about deleting the DTO surface.

## Old To New Mapping

| Previous pattern                                                 | New pattern                                                                                                       |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Import a fixed request schema constant for runtime customization | Build a profile with `createAuthContracts(...)` and consume `*.RequestSchema` from the generated contracts object |
| Keep frontend validators hard-coded in auth-angular              | Provide a shared profile with `provideAuthContracts(...)` so UI rules come from contract metadata                 |
| Keep backend Fastify validation fixed to DTO schemas             | Pass `contracts` into `AuthModule.forRoot(...)` or `AuthModule.forRootFromConfig(...)`                            |
| Manually strip empty optional fields in UI code                  | Let `AuthStore` apply `shapeAuthPayload(...)` based on `emptyStringPolicy`                                        |

## `@anarchitects/auth-ts` Migration

If you only consume DTO types, no change is required.

If you customize auth request rules, switch to a generated contracts object:

```ts
import { type AuthContractConfig, DefaultAuthContractConfig, assertContractCompatibility, createAuthContracts } from '@anarchitects/auth-ts';

const profile: AuthContractConfig = {
  ...DefaultAuthContractConfig,
  version: '1.0.0',
  register: {
    ...DefaultAuthContractConfig.register,
    name: {
      ...DefaultAuthContractConfig.register.name,
      required: true,
      minLength: 3,
      emptyStringPolicy: 'strip',
    },
  },
};

assertContractCompatibility(profile, '1.0.0');

const contracts = createAuthContracts(profile);
```

Then consume `contracts.registerRequestSchema`, `contracts.loginRequestSchema`, and the matching `*.FormMeta` values instead of relying on fixed schema constants as your customization seam.

## `@anarchitects/auth-nest` Migration

Backend validation is now contract-driven at module bootstrap.

Default profile:

```ts
import { AuthModule } from '@anarchitects/auth-nest';

AuthModule.forRoot({
  presentation: {
    application: {
      encryption: {
        algorithm: 'bcrypt',
        key: process.env.AUTH_ENCRYPTION_KEY!,
      },
    },
  },
});
```

Custom profile:

```ts
import { AuthModule } from '@anarchitects/auth-nest';

AuthModule.forRoot({
  contracts: {
    register: {
      name: {
        required: true,
        minLength: 3,
      },
    },
  },
  presentation: {
    application: {
      encryption: {
        algorithm: 'bcrypt',
        key: process.env.AUTH_ENCRYPTION_KEY!,
      },
    },
  },
});
```

Config-driven composition uses the same `contracts` override path:

```ts
AuthModule.forRootFromConfig({
  contracts: {
    login: {
      password: {
        required: false,
      },
    },
  },
});
```

There is intentionally no dedicated `AUTH_*` contract env tree yet. Contract customization is explicit and code-level.

## `@anarchitects/auth-angular` Migration

Frontend auth forms and submit shaping now consume the same contract profile.

Default profile:

```ts
import { provideAuthConfig } from '@anarchitects/auth-angular/config';
import { provideAuthState } from '@anarchitects/auth-angular/state';

export const appProviders = [...provideAuthConfig({ apiResourcePath: 'auth' }), ...provideAuthState()];
```

Custom profile:

```ts
import { provideAuthConfig, provideAuthContracts } from '@anarchitects/auth-angular/config';
import { provideAuthState } from '@anarchitects/auth-angular/state';

export const appProviders = [
  ...provideAuthConfig({ apiResourcePath: 'auth' }),
  ...provideAuthContracts({
    register: {
      name: {
        required: true,
        minLength: 3,
        emptyStringPolicy: 'strip',
      },
    },
  }),
  ...provideAuthState(),
];
```

Effects of that provider:

- auth form components render required/minLength/maxLength from the profile
- pre-submit payload shaping uses the same `emptyStringPolicy`
- `AuthStore` remains the submit boundary; UI components still emit raw DTOs

## Version Compatibility

Contract profiles carry a `version` field and compatibility checks are exact today.

- Pin the version you expect with `assertContractCompatibility(...)`.
- Treat stricter constraints as breaking changes.
- Update consumers intentionally when a profile version changes.

## Migration Checklist

1. Keep DTO type imports such as `LoginRequestDTO` unless you need custom runtime behavior.
2. Stop treating fixed `*RequestSchema` exports as the customization seam.
3. Build custom runtime/form behavior from `createAuthContracts(...)`.
4. Pass backend overrides through `AuthModule.forRoot({ contracts })` or `AuthModule.forRootFromConfig({ contracts })`.
5. Pass frontend overrides through `provideAuthContracts(...)`.
6. Regenerate and diff OpenAPI after schema-impacting changes:
   - `yarn nx run api-specs:generate`
   - `yarn nx run api-specs:lint`
   - `yarn nx run api-specs:diff`
7. Re-validate the docs hub when README or guide content changes:
   - `yarn nx run docs-hub:validate-content`
   - `yarn nx run docs-hub:build`
   - `yarn nx run docs-hub:verify`
