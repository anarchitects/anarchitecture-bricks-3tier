# @anarchitects/contacts-ts-dtos

Shared TypeScript DTOs and TypeBox schemas for the Contacts API. These objects are the single source of truth for request/response payloads across frontend and backend layers.

## Features

- 🧱 `ContactRequestSchema` / `ContactResponseSchema` built with `@sinclair/typebox`.
- 🧾 Exported `ContactRequestDto` and `ContactResponseDto` types stay in sync with the schemas.
- ✅ Vitest specs validate the runtime behaviour (min/max constraints, email format, etc.).

## Installation

```bash
npm install @anarchitects/contacts-ts-dtos @sinclair/typebox
# or
yarn add @anarchitects/contacts-ts-dtos @sinclair/typebox
```

## Usage

```ts
import { ContactRequestSchema, ContactRequestDto } from '@anarchitects/contacts-ts-dtos';
import { Value } from '@sinclair/typebox/value';

function handle(payload: ContactRequestDto) {
	if (!Value.Check(ContactRequestSchema, payload)) {
		throw new Error('Invalid contact payload');
	}
	// proceed with validated data
}
```

Pair these DTOs with transport layers (Nest controllers, frontend forms) to guarantee contract compliance.

## Nx targets (maintainers)

```bash
yarn nx test contacts-ts-dtos
yarn nx build contacts-ts-dtos
```

The build step emits typed bundles for npm; always regenerate before releasing.
