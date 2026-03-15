# @anarchitects/common-angular-ui-layouts/registry

DI-based layout registration and discovery.

Exports:

- `ANX_LAYOUT_DEFINITIONS` multi token
- `ANX_LAYOUT_DEFAULTS` defaults token
- `provideAnxLayouts(...)`
- `provideAnxLayoutDefaults(...)`
- `provideAnxLayoutRegistryConfig(...)`
- `AnxLayoutRegistryService`

Behavior:

- Duplicate layout ids fail fast at registry initialization
- Active layout resolution precedence:
  explicit input > provider default > fallback
