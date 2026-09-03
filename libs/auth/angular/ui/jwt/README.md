# @anarchitects/auth-angular/ui/jwt

JWT plugin-specific presentational UI components for `@anarchitects/auth-angular`.

Use this entrypoint only when the JWT plugin is enabled. The root `@anarchitects/auth-angular/ui` entrypoint remains the default surface for core auth forms.

## Exports

- `AnarchitectsAuthJwtUiRefreshTokensForm`

The JWT UI layer remains presentational only. It composes the Signal Forms-based
`AnarchitectsUiForm`, forwards forms-owned layout and `schemaExtensions` inputs, and is
styled by the host application's `@anarchitects/tailwind` import. Submit handling and
token storage belong to `feature/jwt` and `state/jwt`.
