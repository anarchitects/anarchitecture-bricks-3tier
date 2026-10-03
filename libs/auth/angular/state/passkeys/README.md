# @anarchitects/auth-angular/state/passkeys

Optional WebAuthn enrollment and sign-in orchestration using NgRx SignalStore.
Register the core `provideAuthState()` once at your chosen session scope, then
provide passkey state at the route, component, or application scope:

```ts
import { provideAuthPasskeyState } from '@anarchitects/auth-angular/state/passkeys';

export const accountRoute = {
  path: 'account',
  providers: [...provideAuthPasskeyState()],
  loadComponent: () => import('./account-page').then((m) => m.AccountPage),
};
```

`provideAuthPasskeyState()` registers `AuthPasskeyStore`, `PasskeyApi`, and
`WebAuthnClient`. It inherits the nearest `AuthStore`; it does not create a second
session store. Neither the store nor its adapters register global singletons.
For advanced composition, provide these classes individually and override either
adapter with an Angular provider.

From a host feature, inject `AuthPasskeyStore` and trigger ceremonies from a user
action:

```ts
readonly passkeys = inject(AuthPasskeyStore);

// Click handlers, not automatic startup effects:
enroll() { this.passkeys.enroll({ name: 'My laptop' }); }
signIn() { this.passkeys.signIn(); }
cancel() { this.passkeys.cancel(); }
```

These methods are reactive commands, not awaitable promises. Observe `loading()`,
`success()`, `cancelled()`, and `error()` for completion. `isSupported()` checks
secure-context WebAuthn and native JSON conversion support, returning false on
SSR and unsupported browsers. Hosts own button disabling, accessible status
messages, navigation after success, and password fallback UI.

Only one ceremony may run per store at a time; further enrollment/sign-in triggers
are ignored until completion or cancellation. Explicit cancellation and scope
destruction unsubscribe HTTP requests and abort an active browser prompt. Browser
cancellation/timeouts set `cancelled` without a user-facing error; other failures
set `error`. Both allow another attempt. Cancellation cannot undo a request already
processed by the server. Cancel an active ceremony before starting another auth
workflow such as logout.

Enrollment requires a fresh existing server session and leaves the current session
signals intact. Verified sign-in accepts the returned user/RBAC into the existing
`AuthStore`, which rebuilds its CASL ability. An older startup restore response
cannot overwrite that newly accepted session. Challenges, credentials, and session
cookies are not persisted in browser storage by this store.

Enable the Nest passkeys plugin and apply its migrations before use. See the
[server guide](../../../nest/README.md#optional-passkey-server-ceremonies) and
[data-access guide](../../data-access/passkeys/README.md).
