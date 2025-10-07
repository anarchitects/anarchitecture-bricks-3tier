# @anarchitects/contacts-nest-infra-mailer

NestJS infrastructure adapter that fulfils the `CONTACTS_MAIL_SENDER` port using `@nestjs-modules/mailer`. It plugs into the Contacts application layer and sends both admin notifications and customer confirmations.

## Features

- ✉️ Implements the `ContactsMailSender` interface from `@anarchitects/contacts-nest-application`.
- 🧩 Exposes `ContactsNestInfraMailerModule` that wires the mailer adapter and exports the application-layer token.
- ⚙️ Provides `contactsMailerConfig` (with `InjectContactsMailerConfig`) for template names driven by environment variables.

## Installation

```bash
npm install @anarchitects/contacts-nest-infra-mailer @nestjs-modules/mailer @nestjs/config
# or
yarn add @anarchitects/contacts-nest-infra-mailer @nestjs-modules/mailer @nestjs/config
```

## Getting started

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { ContactsNestInfraMailerModule, contactsMailerConfig } from '@anarchitects/contacts-nest-infra-mailer';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ConfigModule.forFeature(contactsMailerConfig),
    MailerModule.forRootAsync({
      useFactory: () => ({ transport: process.env.MAILER_TRANSPORT }),
    }),
    ContactsNestInfraMailerModule,
  ],
})
export class ContactsInfraModule {}
```

The adapter first notifies an administrator and then sends a confirmation email back to the contact requestor, using template names provided by configuration.

## Configuration

| Variable                       | Description                               | Default   |
| ------------------------------ | ----------------------------------------- | --------- |
| `CONTACTS_MAILER_TEMPLATE_IN`  | Template used for the admin notification. | `default` |
| `CONTACTS_MAILER_TEMPLATE_OUT` | Template used for the user confirmation.  | `html`    |

Combine these with the SMTP settings supplied by `@anarchitects/common-nest-config-mailer`.

## Nx targets (maintainers)

```bash
yarn nx test contacts-nest-infra-mailer
yarn nx build contacts-nest-infra-mailer
```

Ensure the adapter stays in sync with contract changes before publishing to npm.
