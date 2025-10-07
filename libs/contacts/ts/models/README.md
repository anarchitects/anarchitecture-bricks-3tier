# @anarchitects/contacts-ts-models

Canonical TypeScript interfaces for the Contacts domain. These models capture the structural contract shared by backend services, frontend clients, and DTO transformations.

## Features

- 🧬 Exports the `Contact` type used throughout the stack.
- 🤝 Ensures parity with persistence entities and transport DTOs.
- 🧪 Vitest specs guard required properties and timestamps.

## Installation

```bash
npm install @anarchitects/contacts-ts-models
# or
yarn add @anarchitects/contacts-ts-models
```

## Usage

```ts
import type { Contact } from '@anarchitects/contacts-ts-models';

function renderContact(contact: Contact) {
  return `${contact.name} <${contact.email}> wrote: ${contact.message}`;
}
```

Reference these types rather than inventing local interfaces to stay aligned with the contracts generated from `contracts/openapi.yaml`.

## Nx targets (maintainers)

```bash
yarn nx test contacts-ts-models
yarn nx build contacts-ts-models
```

Keep tests green before releasing to guarantee model compatibility.
