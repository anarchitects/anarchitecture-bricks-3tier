# @anarchitects/forms-angular/ui

Presentational domain UI components for `@anarchitects/forms-angular`.

## Exports

- `AnarchitectsUiForm`
- `AnarchitectsFormsUiSubmitted`
- `AnarchitectsFormsUiSubmissionList`
- `AnarchitectsFormsUiSubmissionDetail`
- `AnarchitectsFormsSlotDirective`
- `AnarchitectsFormsTemplateDirective`
- `FormsFormModel`, `FormsSchemaExtension`, and `createFormsModel`

These components own the forms capability's layout and projection behavior. They use
`@anarchitects/tailwind` variables and utilities without depending on the retired
Common Angular UI packages. Named `anxSlot` regions provide additive content and
`ng-template[anxTemplate]` supports `field` and `actions` overrides.

`AnarchitectsUiForm` supports declarative cross-field rules through
`config.validationRules` and local-only Angular Signal Forms `schemaExtensions` for
host rules that should not become part of the shared form contract. Its `formModel`
signal uses non-null defaults and its `signalForm` field tree exposes touched, dirty,
invalid, and pending state. Successful submission emits the existing DTO and resets
both values and field state.

`formGroup` and `runtimeValidators` were removed in the Angular 22 Signal Forms
migration. Consumers must use `formModel`/`signalForm` and `schemaExtensions` instead.

## License

Released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
