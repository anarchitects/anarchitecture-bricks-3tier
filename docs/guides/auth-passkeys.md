# Passkey consumer integration

This guide covers enrollment and sign-in through the public auth packages. The
host composes one auth backend and one core Angular session store. It does not
create a second Better Auth instance or import package internals.

## Available public surfaces

| Package entry point                                  | Consumer surface                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| `@anarchitects/auth-ts/dtos/passkeys`                | Begin/finish request and response DTOs and route schemas                       |
| `@anarchitects/auth-nest`                            | `AuthModule`, `AuthPasskeyService`                                             |
| `@anarchitects/auth-nest/presentation`               | `AuthPresentationModule`, `PasskeyAuthController`                              |
| `@anarchitects/auth-nest/application`                | `AuthApplicationModule`, `AuthPasskeyService` for advanced composition         |
| `@anarchitects/auth-nest/infrastructure-persistence` | `PasskeyEntity` and passkey migrations alongside core auth entities/migrations |
| `@anarchitects/auth-angular/data-access/passkeys`    | `PasskeyApi`, `WebAuthnClient`, `PasskeyBrowserError`                          |
| `@anarchitects/auth-angular/state/passkeys`          | `AuthPasskeyStore`, `provideAuthPasskeyState`, `PasskeyEnrollmentOptions`      |
| `@anarchitects/auth-angular/feature/passkeys`        | `AnarchitectsAuthPasskeys`, `provideAuthPasskeyFeature`                        |
| `@anarchitects/auth-angular/ui/passkeys`             | `AnarchitectsAuthUiPasskeys`, `PasskeyMode`, `PasskeyUiLabels`                 |

Passkey listing, rename, and removal are not
exposed by the package's public HTTP surface. Do not assume Better Auth's internal
management endpoints are mounted by `AuthModule`.

## Nest facade and persistence

Configure TypeORM once at the host root, with migrations and `synchronize: false`.
For a fresh database, the following uses only public package exports. Existing
hosts append the missing migrations to their established migration list and apply
them before rollout; see [upgrade and rollback guidance](auth-migration.md#passkey-credential-storage-expansion).

```ts
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@anarchitects/auth-nest';
import { CreateAuthSchema1720200000000, CreateBetterAuthPasskeysTable1760200001000, AddBetterAuthAccountIssuer1788275931000, ExpandPasskeyCredentialStorage1790899200000 } from '@anarchitects/auth-nest/infrastructure-persistence';

// Resolve these values in the host configuration layer.
export function authImports(databaseUrl: string, secret: string) {
  return [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: databaseUrl,
      autoLoadEntities: true,
      synchronize: false,
      migrations: [CreateAuthSchema1720200000000, CreateBetterAuthPasskeysTable1760200001000, AddBetterAuthAccountIssuer1788275931000, ExpandPasskeyCredentialStorage1790899200000],
    }),
    AuthModule.forRoot({
      mailer: { provider: 'noop' },
      presentation: {
        application: {
          betterAuth: {
            baseUrl: 'https://api.example.com/api/auth',
            secret,
            callbackUrls: {
              verifyEmail: 'https://app.example.com/verify-email',
              resetPassword: 'https://app.example.com/reset-password',
            },
          },
          plugins: {
            passkeys: {
              enabled: true,
              rpID: 'example.com',
              rpName: 'Example',
              origin: 'https://app.example.com',
            },
          },
        },
      },
    }),
  ];
}
```

Use those imports in the host module. Apply migrations with the host's migration
runner; listing migrations alone does not run them. The test host uses
`migrationsRun: true` only for its disposable database. Configure a mail transport
if the host needs verification/recovery emails; the snippet explicitly disables
mail delivery using the no-op provider.

The enabled plugin registers its entity for Nest's `autoLoadEntities`. For a
standalone runtime or migration DataSource, explicitly include the public entities:

```ts
import { AccountEntity, AuthUserEntity, PermissionEntity, RoleEntity, SessionEntity, VerificationEntity, PasskeyEntity } from '@anarchitects/auth-nest/infrastructure-persistence';

const entities = [AccountEntity, AuthUserEntity, PermissionEntity, RoleEntity, SessionEntity, VerificationEntity, PasskeyEntity];
```

Keep any cross-domain foreign keys in host integration schemas, following the
repository's runtime/migrations DataSource convention. No cross-domain TypeORM
relations belong in domain entities.

For configuration-driven composition, `AuthModule.forRootFromConfig(overrides)`
reads the typed auth configuration (`AUTH_PLUGIN_PASSKEYS_ENABLED`,
`AUTH_PLUGIN_PASSKEY_RP_ID`, `AUTH_PLUGIN_PASSKEY_RP_NAME`,
`AUTH_PLUGIN_PASSKEY_ORIGIN`). Explicit overrides take precedence. Advanced hosts
can use `AuthPresentationModule` or compose `AuthApplicationModule` and a public
controller themselves; they own cookie forwarding when calling the service directly.

The expected origin is server configuration, not a value selected by a request.
For separate frontend/backend origins, configure the frontend origin explicitly.
The RP ID must match or be a parent domain of its hostname. A same-origin `/api`
proxy is the simplest Angular deployment: the adapter uses relative URLs.
Configure host CORS/cookie policy deliberately if using a cross-origin interceptor.
Production requires HTTPS; localhost is used by the executable contract host.

## HTTP contract

All four endpoints are POST and return 200 on success. Paths below include the
host's `/api` prefix; the controller itself starts at `/auth/passkeys`.

| Path                                       | Request                                                               | Success body                   | Session requirement                            |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------- |
| `/api/auth/passkeys/registration/begin`    | `{}` or `{ authenticatorAttachment: 'platform' \| 'cross-platform' }` | WebAuthn JSON creation options | Fresh authenticated session                    |
| `/api/auth/passkeys/registration/finish`   | `{ response: registrationCredential, name?: string }`                 | `{ success: true }`            | Same fresh authenticated user                  |
| `/api/auth/passkeys/authentication/begin`  | `{}`                                                                  | WebAuthn JSON request options  | Public                                         |
| `/api/auth/passkeys/authentication/finish` | `{ response: authenticationCredential }`                              | `{ user, rbac }`               | Public; establishes session after verification |

Forward all incoming cookies and every returned `Set-Cookie` header. The browser
must preserve challenge cookies between begin and finish. Registration binds the
challenge to the authenticated user. Authentication finish returns the repository's
session envelope, with no access/refresh token JSON. Call `/api/auth/me` to restore
that session and `/api/auth/logout` to end it.

Malformed DTOs return 400. Anonymous/stale registration sessions and verifier
failures return 4xx responses; clients must not depend on Better Auth error wording.
A failed ceremony must not be treated as authentication. Disabled plugins mount
none of these routes (404). Challenge expiry is five minutes and verification
consumes challenges, including failed verification attempts; retry starts a new
begin request. User verification follows the current `preferred` policy, so the
capability does not promise a mandatory biometric/PIN step.

The generated [OpenAPI specification](../openapi/openapi.yaml) is the structural
contract; cryptographic checks and browser lifecycle behavior are exercised by
the tests below.

## Angular host composition

Provide HttpClient and core auth state at the intended session scope:

```ts
import { provideHttpClient } from '@angular/common/http';
import { provideAuthConfig } from '@anarchitects/auth-angular/config';
import { provideAuthState } from '@anarchitects/auth-angular/state';

const providers = [provideHttpClient(), ...provideAuthConfig({ apiResourcePath: 'auth' }), ...provideAuthState()];
```

Use the public feature and explicitly scope its state on the host component. The
helper inherits the nearest core `AuthStore` and includes the passkey adapters.

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AnarchitectsAuthPasskeys, provideAuthPasskeyFeature } from '@anarchitects/auth-angular/feature/passkeys';

@Component({
  selector: 'app-passkey-sign-in',
  imports: [AnarchitectsAuthPasskeys],
  providers: [...provideAuthPasskeyFeature()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <anarchitects-auth-passkeys>
      <a passkeyFallback href="/login">Use password sign-in</a>
    </anarchitects-auth-passkeys>
  `,
})
export class PasskeySignIn {}
```

For enrollment, use `mode="enroll"` and
`[enrollmentOptions]="{ name: 'This device' }"`. Enrollment is disabled until a
session is present; the backend enforces freshness. Both modes wait during core
auth loading/restoration. Use `labels` for text overrides and `disabled` for host
conditions. The host owns fallback routing and navigation after success. Observe
`AuthStore`/`AuthPasskeyStore` signals; the component never prompts on startup.

Advanced consumers can use `provideAuthPasskeyState()` with custom UI, or bind
`AnarchitectsAuthUiPasskeys` inputs/outputs directly. Components introduce no
hidden providers that mask host adapter overrides. Component-scoped providers
abort pending prompts on destruction. Longer-lived route/application scopes can
outlive a view; explicitly cancel pending work when leaving that view.

When composing state directly, authenticate first and call
`passkeys.enroll({ name: 'This device' })` from a user action. Enrollment leaves the existing session intact; verified sign-in
hydrates the core user, RBAC, and CASL ability. The commands are reactive and are
not awaitable promises. Observe signals for completion and own navigation in the host.

Only one ceremony runs per store at a time. Cancellation and scope destruction
abort browser work and unsubscribe pending HTTP requests; they cannot undo a
request already processed by the server. Cancel before starting another auth
workflow, such as logout. Cancellation/timeout sets `cancelled`; other failures
set `error`, and either outcome permits a new attempt.

Secure-context WebAuthn and native `parseCreationOptionsFromJSON`,
`parseRequestOptionsFromJSON`, and credential `toJSON()` APIs are required.
`isSupported()` returns false on SSR or unsupported browsers. Keep password fallback;
do not prompt automatically during startup or SSR. Credentials/challenges are not
written to localStorage by the package.

The [executable example](https://github.com/anarchitects/anarchitecture-bricks-3tier/blob/main/examples/auth-angular-example/src/app/passkeys/passkey-page/passkey-page.ts)
shows enrollment, sign-in, logout, session display, cancellation, and fallback using
only public Angular imports.

## Contract validation

Start Docker and install this workspace's Chromium once:

```sh
yarn playwright install chromium
yarn nx run auth-angular-example-e2e:passkey-contract-test
```

The target builds the example and backend, starts disposable PostgreSQL with real
migrations, serves the consumer at `http://localhost:4318`, and cleans up on exit.
Set `PASSKEY_CONTRACT_PORT` if that port is occupied. It never connects to a host's
existing database. The dedicated CI workflow installs Chromium with system
dependencies and runs the target without distributed execution.

| Target                                           | Evidence                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `auth-angular-example-e2e:passkey-contract-test` | Native Chromium JSON conversion and virtual authenticator → public Angular store/API → public Nest facade → published TypeORM adapter/PostgreSQL; enrollment, cookie session/restore, cancellation, feature teardown, signature rejection/retry, replay, missing cookies, anonymous enrollment, malformed requests, unsupported-browser fallback |
| `auth-nest:test-passkeys`                        | Real verifier checks for challenge/origin/RP ID, expiry, ownership, signature, replay, counters, and disabled capability, using memory persistence                                                                                                                                                                                               |
| `auth-nest:test-published-adapter`               | PostgreSQL persistence, restart, concurrent replay, uniqueness, migration upgrade/rollback, counter limits and user cascade                                                                                                                                                                                                                      |
| `auth-angular:test`                              | SSR/unsupported API handling, scoped stores, duplicate commands, cancellation, malformed session/RBAC and stale restoration                                                                                                                                                                                                                      |
| `angular-consumer-compatibility:test-22`         | Packs the libraries, asserts all four passkey exports, and compiles the example in an isolated npm consumer without workspace aliases                                                                                                                                                                                                            |
| `api-specs:lint` and `api-specs:verify`          | Generated route/schema consistency                                                                                                                                                                                                                                                                                                               |

The browser suite uses [Playwright CDP sessions](https://playwright.dev/docs/api/class-cdpsession)
and [Chromium's virtual authenticator](https://chromedevtools.github.io/devtools-protocol/tot/WebAuthn/), not a physical device.
It proves browser API serialization and server verification without mocking successful
auth responses. Physical hardware, platform account sync, other browsers, and
production proxy/TLS/cookie deployment remain host acceptance checks. The older
`auth-angular-example:contract-test` Prism target checks password API schemas;
Prism alone cannot validate passkey cryptography or session cookies.
