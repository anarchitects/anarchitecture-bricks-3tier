# @anarchitects/forms-angular/ui

Presentational domain UI components for `@anarchitects/forms-angular`.

## Exports

- `AnarchitectsUiForm`
- `AnarchitectsFormsUiSubmitted`
- `AnarchitectsFormsUiSubmissionList`
- `AnarchitectsFormsUiSubmissionDetail`

These components are layout-compatible (`anarchitects-ui-layout-host`) and support
template overrides via canonical `ng-template[anxTemplate]` contracts.

`AnarchitectsUiForm` supports declarative cross-field rules through
`config.validationRules` and local-only Angular `runtimeValidators` for host-specific
`ValidatorFn` composition that should not become part of the shared form contract.

## License

Released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
