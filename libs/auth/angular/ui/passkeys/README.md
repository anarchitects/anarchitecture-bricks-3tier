# @anarchitects/auth-angular/ui/passkeys

`AnarchitectsAuthUiPasskeys` is presentational: it has no HTTP, auth-store, or
WebAuthn dependency. Use `AnarchitectsAuthPasskeys` from `feature/passkeys` for
complete orchestration.

Inputs: `mode` (`'sign-in'` or `'enroll'`, default `'sign-in'`), `supported` (default
false), `disabled`, `loading`, `success`, `cancelled` (all default false), `error`
(default null), and `labels` (partial `PasskeyUiLabels` overrides).

Outputs: `requested` and `cancelRequested`, both emitting `void`. Actions occur
only on button clicks. Pending work disables the primary button and keeps cancel
available. Status uses a polite live region; errors use `role="alert"`. Unsupported
browsers show guidance and omit the primary action.

```html
<anarchitects-auth-ui-passkeys [supported]="supported()" [loading]="loading()" [error]="error()" (requested)="startSignIn()" (cancelRequested)="cancel()">
  <a passkeyFallback href="/login">Use password sign-in</a>
</anarchitects-auth-ui-passkeys>
```

`PasskeyMode` and `PasskeyUiLabels` are public types. Label keys are `signIn`,
`enroll`, `cancel`, `pending`, `completed`, `cancelled`, and `unsupported`. Supply
translated strings through `labels` and project fallback content via `[passkeyFallback]`.

Uses the shared Tailwind foundation. Include package templates in the host's
Tailwind source detection as described in the [package guide](../../README.md).
Storybook **Auth UI/Passkeys** shows sign-in, enrollment, pending, cancellation,
completion, failure, unsupported browsers, and password fallback.
