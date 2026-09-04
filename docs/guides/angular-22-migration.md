# Angular 22 and TypeScript 6 Migration Notes

## Scope

Issue #368 moves the workspace from Angular 21.1 to Angular 22 and TypeScript 6. The migration was
applied in two checkpoints: Angular 21.1 to 21.2, followed by Angular 21.2 to 22. The Angular 21.2
checkpoint was installed and the published Angular libraries were built and typechecked before the
second migration.

The final workspace baseline is:

- Angular framework/compiler `22.0.8` and Angular CLI/build tooling `22.0.9`
- TypeScript `6.0.3`
- NgRx operators/signals `22.x`
- angular-eslint `22.2`, ng-packagr `22.0`, and jest-preset-angular `17.0`
- Nx `23.1.3`, Storybook `10.5`, and ts-jest `29.4` retained because their installed versions support
  the new Angular/TypeScript baseline
- Storybook test-runner `0.24.4` and Playwright `1.62.1`, restoring the existing Webpack Storybook
  interaction-test target with one shared browser revision

## Migration Outcomes

The official Angular migrations supplied the required test compatibility changes, including explicit
XHR HTTP testing and the Angular 22 route-guard invocation shape. Host components touched by the
migration use `OnPush`, preserving the workspace's change-detection convention instead of opting out
with `Eager`.

Angular 22 template diagnostics that newly report existing redundant optional chaining and nullish
coalescing are suppressed in the migrated library configurations. This preserves the Angular 21
behavior for the compatibility wave; new code should still avoid redundant operators.

Node 26 exposes an unavailable `localStorage` global that shadows jsdom during Angular Vitest runs.
Angular tests therefore use the shared in-memory browser-storage bootstrap at
`tools/testing/setup-angular-tests.ts`.

Published Angular package peer ranges are minimally widened to Angular `^21 || ^22`; packages using
NgRx similarly accept NgRx 21 or 22. Issue #369 owns packaged-consumer proof and the complete adjacent
peer audit.

## Published package compatibility

Issue #369 validates the final compatibility line on the Angular 22 workspace and records the release
status of every Angular project at that historical checkpoint. The four Common Angular source projects
were subsequently removed by issue #377; their published compatibility artifacts remain downloadable:

| Project                         | Angular peers    | Adjacent peers       | Release status                  |
| ------------------------------- | ---------------- | -------------------- | ------------------------------- |
| `auth-angular`                  | Angular 21/22    | NgRx 21/22, RxJS 7.8 | `auth` release group            |
| `forms-angular`                 | Angular 21/22    | NgRx 21/22, RxJS 7.8 | `forms` release group           |
| `identity-angular`              | Angular 21.1+/22 | RxJS 7.8             | `identity` release group        |
| `common-angular-design`         | Angular 21/22    | None                 | `common-angular` release group  |
| `common-angular-ui-composition` | Angular 21/22    | None                 | `common-angular` release group  |
| `common-angular-ui-layouts`     | Angular 21/22    | RxJS 7.8             | `common-angular` release group  |
| `common-angular-ui-primitives`  | Angular 21/22    | None                 | `common-angular` release group  |
| `storybook-angular`             | Angular 21/22    | Storybook 10         | Private documentation/test host |

`storybook-angular` has no distributable library API, so it is explicitly private and remains outside
all release groups. The release compatibility guard rejects any other public Angular package that is
not covered by an Nx release group. Its packed-manifest mode also compares every built public package's
peer metadata with its source manifest.

## TypeScript 6 Compatibility Decisions

The workspace still relies on `baseUrl`, path aliases, and CommonJS/Node 10 module resolution in its
Nest and Jest configurations. TypeScript 6 deprecates that resolution mode, so affected configurations
set `ignoreDeprecations` to `6.0`. Replacing it requires a coordinated module-resolution migration and
must be completed before TypeScript 7 removes the behavior.

`openapi-typescript` currently declares a TypeScript 5 peer range even though the API-spec generation
target runs successfully on TypeScript 6. No TypeScript-6-compatible release is available at this
checkpoint, so the peer warning is a documented upstream exception rather than a runtime blocker.

No ESLint flat config references the removed `@typescript-eslint/ban-types` rule, so no rule migration
was needed. The spec configurations did not require project-specific `isolatedModules` removal: the
workspace typecheck and Angular runtime test suites pass with the migrated configuration.

## Validation

Run migration validation without Nx cache:

```bash
yarn nx run-many -t lint test build typecheck --skipNxCache
yarn nx run storybook-angular:build-storybook --skipNxCache
yarn nx run storybook-angular:test-storybook --skipNxCache
yarn nx run release-tools:validate-angular-package-compatibility --skipNxCache
yarn nx run release-tools:validate-angular-packed-manifests --skipNxCache
yarn nx run api-specs:generate --skipNxCache
```

The Browserslist stale-data notice is advisory and unrelated to Angular compiler compatibility.
