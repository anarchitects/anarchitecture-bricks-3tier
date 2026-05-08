# @anarchitects/identity-angular

Angular identity package shells for the Anarchitecture identity domain.

## Developer + AI Agent Start Here

- Use the root package for routine setup and the secondary entry points for targeted composition.
- Keep state explicitly provided through helper functions; do not add `providedIn: 'root'` stores.
- Avoid deep imports from internal source files.

## Features

- Root barrel for `config`, `data-access`, `feature`, `state`, and `ui`
- Explicit provider helpers for config, data-access, and state composition
- Minimal placeholder layers with no routed UI or API behavior in issue `#310`

## Installation

```bash
npm install @anarchitects/identity-angular
# or
yarn add @anarchitects/identity-angular
# or
pnpm add @anarchitects/identity-angular
```

## Entry points

| Import path                                  | Description                                            |
| -------------------------------------------- | ------------------------------------------------------ |
| `@anarchitects/identity-angular`             | Root barrel for routine app wiring                     |
| `@anarchitects/identity-angular/config`      | Config tokens and provider helpers                     |
| `@anarchitects/identity-angular/data-access` | Identity data-access placeholder service and providers |
| `@anarchitects/identity-angular/feature`     | Feature-level provider composition                     |
| `@anarchitects/identity-angular/state`       | Explicitly provided identity state store               |
| `@anarchitects/identity-angular/ui`          | Reserved UI entry point placeholder                    |

## Usage

```ts
import { provideIdentityFeature } from '@anarchitects/identity-angular';

export const appConfig = {
  providers: [...provideIdentityFeature()],
};
```

## Scripts

- `yarn nx run identity-angular:build`
- `yarn nx run identity-angular:test`

## Development notes

- This package intentionally ships no UI workflows, routes, or HTTP behavior in issue `#310`.
- Future identity features should extend the public layer entry points instead of adding internal-path imports.

## Contributing

Preserve the `ui <- feature -> state -> data-access` layering and keep configuration shared through public provider helpers.

## License

Licensed under the Apache License, Version 2.0.
