# @anarchitects/ts-frontend-data-access

Shared frontend data-access helpers and OpenAPI-generated types for the Contacts surface area. The library re-exports the generated `ApiTypes` bundle so React/Angular/Vue clients can stay aligned with the backend contract.

## Features

- 🔁 `gen-client` target generates TypeScript definitions from `contracts/openapi.yaml` via `openapi-typescript`.
- 🧩 Exposes convenient re-exports from `src/lib/client.ts` for consuming applications.
- 🧪 Vite/Vitest-friendly build pipeline for type-safe bundling.

## Installation

```bash
npm install @anarchitects/ts-frontend-data-access
# or
yarn add @anarchitects/ts-frontend-data-access
```

## Generating API types

```bash
yarn nx run ts-frontend-data-access:gen-client
```

The command writes OpenAPI types to `src/lib/generated/api.types.ts`. Commit the generated file (it is part of the npm package) so consumers can rely on the definitions without running codegen.

## Usage

```ts
import { ApiTypes } from '@anarchitects/ts-frontend-data-access';

type ContactResponse = ApiTypes.paths['/contacts']['post']['responses'][201]['content']['application/json'];
```

Pair these types with your preferred HTTP client or state management layer.

## Nx targets (maintainers)

```bash
yarn nx run ts-frontend-data-access:gen-client
yarn nx run ts-frontend-data-access:types
yarn nx build ts-frontend-data-access
```

Run `gen-client` before `types`/`build` to ensure fresh contract definitions.
