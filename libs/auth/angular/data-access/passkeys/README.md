# @anarchitects/auth-angular/data-access/passkeys

Optional, explicitly provided adapters for passkey ceremonies. `PasskeyApi` uses
Angular `HttpClient` and contracts from `@anarchitects/auth-ts/dtos/passkeys`:

| Method                      | POST path (default)                        |
| --------------------------- | ------------------------------------------ |
| `beginRegistration(dto?)`   | `/api/auth/passkeys/registration/begin`    |
| `finishRegistration(dto)`   | `/api/auth/passkeys/registration/finish`   |
| `beginAuthentication()`     | `/api/auth/passkeys/authentication/begin`  |
| `finishAuthentication(dto)` | `/api/auth/passkeys/authentication/finish` |

Configure the resource segment with `provideAuthConfig({ apiResourcePath })`.
Requests include credentials to preserve the server's challenge and session
cookies. Auth-failure redirects are suppressed so the calling feature can display
errors or offer password login. Authentication responses validate user identity
and RBAC before state hydration.

`WebAuthnClient.create(options)` and `.get(options)` return cold observables over
`navigator.credentials.create/get`. Each subscription has an `AbortController`;
unsubscription aborts the browser ceremony. `PasskeyBrowserError.kind` separates
`unsupported`, `cancelled` (including timeout), and `failed` outcomes.

The adapter requires a secure context plus native
`PublicKeyCredential.parseCreationOptionsFromJSON`,
`parseRequestOptionsFromJSON`, and credential `toJSON()` support. It uses those
browser APIs to convert base64url transport fields to/from binary data. No polyfill
is bundled; unsupported browsers should retain the host's password login path.
`isSupported()` returns false during SSR without calling credential APIs.

For the usual setup, use `provideAuthPasskeyState()` from the state/passkeys entry
point. Advanced consumers may explicitly provide `PasskeyApi` and `WebAuthnClient`
and compose their observables themselves. Both adapters require explicit providers.

The default path assumes the host Nest application uses the `/api` global prefix
(or a matching proxy). Configure the server RP ID and allowed origin for the actual
frontend origin; those are server policy and are not selected by the browser.
