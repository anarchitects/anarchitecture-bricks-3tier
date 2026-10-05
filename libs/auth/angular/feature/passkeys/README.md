# @anarchitects/auth-angular/feature/passkeys

`AnarchitectsAuthPasskeys` connects the explicitly scoped `AuthPasskeyStore` to
`AnarchitectsAuthUiPasskeys`. It supports enrollment and sign-in without host-written
WebAuthn orchestration. Provide core `provideAuthState()` and `provideHttpClient()`
in a visible parent scope.

```ts
import { Component } from '@angular/core';
import { AnarchitectsAuthPasskeys, provideAuthPasskeyFeature } from '@anarchitects/auth-angular/feature/passkeys';

@Component({
  selector: 'app-passkey-login',
  imports: [AnarchitectsAuthPasskeys],
  providers: [...provideAuthPasskeyFeature()],
  template: `
    <anarchitects-auth-passkeys>
      <a passkeyFallback href="/login">Use password sign-in</a>
    </anarchitects-auth-passkeys>
  `,
})
export class PasskeyLogin {}
```

| Input               | Default     | Purpose                                                  |
| ------------------- | ----------- | -------------------------------------------------------- |
| `mode`              | `'sign-in'` | `'sign-in'` or `'enroll'`                                |
| `enrollmentOptions` | `{}`        | Optional credential `name` and `authenticatorAttachment` |
| `disabled`          | `false`     | Disable the primary action                               |
| `labels`            | `{}`        | Partial `PasskeyUiLabels` text overrides                 |

Project fallback content with `[passkeyFallback]`. The host owns fallback routing
and navigation after success. Observe the shared `AuthStore` and `AuthPasskeyStore`
signals for custom UX. No action or navigation occurs automatically.

Enrollment requires a locally authenticated session; the backend enforces freshness
and ownership. Both modes wait while core auth is loading/restoring. Pending work
disables duplicate submissions and leaves cancellation available.

`provideAuthPasskeyFeature()` composes passkey state and adapters, inheriting the
nearest core `AuthStore`. It creates no global state or second session store. A host
component scope binds prompt teardown to component destruction. Route/application
providers have longer lifetimes: call `AuthPasskeyStore.cancel()` when leaving a
view if its provider stays alive, and before another auth workflow such as logout.

Advanced consumers can use `provideAuthPasskeyState()` and override `PasskeyApi`
or `WebAuthnClient` after the helper in the provider list. The feature component
provides no hidden store that could mask those overrides.

See the [consumer guide](../../../../../docs/guides/auth-passkeys.md) for public
backend routes, persistence configuration, and executable contract validation.
