# @anarchitects/contacts-nest-application

Domain services and ports for the Contacts bounded context. This package represents the NestJS **application layer** and coordinates persistence and mailer adapters through explicit interfaces.

## Features

- 📬 `ContactsService` orchestrates contact creation and triggers notification emails.
- 🔌 Well-defined ports (`CONTACTS_REPOSITORY`, `CONTACTS_MAIL_SENDER`) decouple infrastructure from business logic.
- 🧪 Ships with Jest specs validating orchestration behaviour.

## Installation

```bash
npm install @anarchitects/contacts-nest-application
# or
yarn add @anarchitects/contacts-nest-application
```

## Usage

```ts
import { Module } from '@nestjs/common';
import {
	ContactsNestApplicationModule,
	CONTACTS_REPOSITORY,
	CONTACTS_MAIL_SENDER,
	ContactsService,
} from '@anarchitects/contacts-nest-application';

@Module({
	imports: [ContactsNestApplicationModule],
	providers: [
		{ provide: CONTACTS_REPOSITORY, useClass: InMemoryContactsRepository },
		{ provide: CONTACTS_MAIL_SENDER, useClass: ConsoleMailer },
	],
})
export class ContactsModule {
	constructor(private readonly contacts: ContactsService) {}

	create() {
		return this.contacts.createContact({
			name: 'Ada Lovelace',
			email: 'ada@example.com',
			message: 'Count me in!',
		});
	}
}
```

Provide your own implementations for the repository and mail sender tokens (for example via `@anarchitects/contacts-nest-infra-*`).

## API surface

- `ContactsService#createContact(partialContact)` – persists a `Contact` and requests outbound mail.
- `ContactsRepository` – abstract contract for persistence adapters.
- `ContactsMailSender` – abstract contract for outbound email adapters.

All DTOs reference the shared `Contact` model from `@anarchitects/contacts-ts-models` to keep the stack in sync.

## Nx targets (maintainers)

```bash
yarn nx test contacts-nest-application
yarn nx build contacts-nest-application
```

Run tests before publishing to ensure orchestrations and contracts remain stable.
