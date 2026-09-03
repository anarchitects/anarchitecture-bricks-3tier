# @anarchitects/auth-angular/ui

Domain UI components for `@anarchitects/auth-angular`.

JWT-specific form components live under `@anarchitects/auth-angular/ui/jwt`, not the root UI entry point.

## Exports

- `AnarchitectsAuthUiLoginForm`
- `AnarchitectsAuthUiRegisterForm`
- `AnarchitectsAuthUiActivateUserForm`
- `AnarchitectsAuthUiForgotPasswordForm`
- `AnarchitectsAuthUiResetPasswordForm`
- `AnarchitectsAuthUiVerifyEmailForm`
- `AnarchitectsAuthUiChangePasswordForm`
- `AnarchitectsAuthUiUpdateEmailForm`
- `AnarchitectsAuthUiLogoutForm`

All components compose the Angular 22 Signal Forms-based `AnarchitectsUiForm`. They
support forms-owned layout passthrough, forward `schemaExtensions`, and preserve the
canonical template/slot projection hooks exported by
`@anarchitects/forms-angular/ui`. Validation, non-null payload defaults, successful
submission reset, and interaction state are owned by the forms capability.

The UI uses `@anarchitects/tailwind` through host application CSS and has no dependency
on the retired Common Angular composition or layout packages.

## License

Released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
