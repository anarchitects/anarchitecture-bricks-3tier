# @anarchitects/forms-angular/feature

Feature-level orchestration for the forms Angular stack. Import components such as
`AnarchitectsFeatureForm`, `AnarchitectsFeatureSubmissionList`, and
`AnarchitectsFeatureSubmissionDetail` from this entry point to combine the signal store,
data access, and UI layers into a drop-in experience.

These components remain layout-compatible and forward canonical template/slot hooks to
the underlying UI layer.

## Submission state registration

`AnarchitectsFeatureSubmissionList` and `AnarchitectsFeatureSubmissionDetail` require
`FormsStore` from an enclosing injector. Register `...provideFormsState()` from
`@anarchitects/forms-angular/state` in app providers, route providers, or a parent component's
providers. Place both components under the same provider scope to share submissions state.
See the [state registration examples](../state/README.md#explicit-state-registration) for
app and route configuration, including HTTP and forms configuration dependencies.

**Migration:** These submission components previously created their own store instances.
Consumers must now explicitly register state in an enclosing scope; without it, Angular
reports a missing `FormsStore` provider. Register state on separate parent components or
routes when independent instances are needed. No global store is registered automatically.

`AnarchitectsFeatureForm` retains its component-local store scope.

## License

Released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
