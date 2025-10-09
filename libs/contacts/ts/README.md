# @anarchitects/contacts-ts

Shared TypeScript surface for the Contacts bounded context. This package aggregates the DTO schemas and domain models that power both frontend and backend libraries, exposing them via subpath exports for ergonomic consumption.

## What’s inside?

| Export | Path | Description |
| --- | --- | --- |
| Root | `@anarchitects/contacts-ts` | Re-exports everything from the package (`dtos` + `models`). |
| DTOs | `@anarchitects/contacts-ts/dtos` | TypeBox schemas (`ContactRequestSchema`, `ContactResponseSchema`) and their TypeScript counterparts. |
| Models | `@anarchitects/contacts-ts/models` | Domain-level `Contact` type shared across persistence and presentation layers. |

Each export stays aligned with the OpenAPI contract and is covered by Vitest specs to prevent drift.

## Installation

```bash
npm install @anarchitects/contacts-ts
# or
yarn add @anarchitects/contacts-ts
```

The DTO layer depends on `@sinclair/typebox`; it is bundled as a runtime dependency.

## Usage

```ts
import { Contact } from '@anarchitects/contacts-ts/models';
import {
	ContactRequestDto,
	ContactRequestSchema,
} from '@anarchitects/contacts-ts/dtos';
import { Value } from '@sinclair/typebox/value';

export function normaliseContact(payload: ContactRequestDto): Contact {
	if (!Value.Check(ContactRequestSchema, payload)) {
		throw new Error('Invalid payload');
	}

	return {
		id: crypto.randomUUID(),
		message: payload.message,
		name: payload.name,
		email: payload.email,
		createdAt: new Date(),
		updatedAt: new Date(),
	} satisfies Contact;
}
```

Reference the DTO or model subpaths instead of redefining local interfaces so every layer remains contract-first.

## Nx targets (maintainers)

```bash
yarn nx test contacts-ts
yarn nx build contacts-ts
```

Tests run with Vitest; the build target uses the Vite pipeline to emit ESM + type artifacts ready for npm publishing.
