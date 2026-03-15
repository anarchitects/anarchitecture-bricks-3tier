# @anarchitects/common-angular-ui-layouts/host

Runtime host component for dynamic layout rendering.

Primary export:

- `AnarchitectsUiLayoutHost` (`<anarchitects-ui-layout-host>`)

Inputs:

- `[kind]`: layout kind (`form`, `list`, `detail`, or `app-*`)
- `[layout]`: optional explicit layout id
- `[model]`: renderer model payload
- `[layoutOptions]`: optional layout modifiers

The host collects projected `anxTemplate` and `anxSlot` directives and
forwards them to the resolved layout renderer through `context`.
