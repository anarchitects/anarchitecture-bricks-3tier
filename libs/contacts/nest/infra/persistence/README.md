# @anarchitects/contacts-nest-infra-persistence

TypeORM-backed infrastructure for the Contacts bounded context. This package fulfils the `CONTACTS_REPOSITORY` port exposed by `@anarchitects/contacts-nest-application` and persists data using the `ContactEntity` aggregate.

## Features

- 🗄️ `TypeOrmContactsRepository` implements `findById` and `create` with helpful error handling.
- 🧱 `ContactEntity` mirrors the shared `Contact` model, including UUID v7 primary keys and audit timestamps.
- 🔌 `ContactsNestInfraPersistenceModule` exports the application-layer repository token for easy composition.

## Installation

```bash
npm install @anarchitects/contacts-nest-infra-persistence typeorm @nestjs/typeorm uuidv7
# or
yarn add @anarchitects/contacts-nest-infra-persistence typeorm @nestjs/typeorm uuidv7
```

## Usage

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
	ContactEntity,
	ContactsNestInfraPersistenceModule,
} from '@anarchitects/contacts-nest-infra-persistence';

@Module({
	imports: [
		TypeOrmModule.forFeature([ContactEntity]),
		ContactsNestInfraPersistenceModule,
	],
})
export class ContactsPersistenceModule {}
```

Ensure the enclosing application also imports `TypeOrmModule.forRoot` (or equivalent) so the repository can resolve the `Repository<ContactEntity>` dependency.

## Implementation notes

- `findById` throws `NotFoundException` when a contact record is missing.
- `create` delegates to TypeORM to persist and hydrate the entity, returning the shared `Contact` interface defined in `@anarchitects/contacts-ts-models`.

## Nx targets (maintainers)

```bash
yarn nx test contacts-nest-infra-persistence
yarn nx build contacts-nest-infra-persistence
```

Tests cover the repository and entity behaviour—run them before cutting a release.
