# @anarchitects/contacts-nest-presentation

NestJS controller layer for exposing the Contacts API. This module hosts the public HTTP routing and binds the Fastify-specific route schema to the application and DTO layers.

## Features

- 🌐 `ContactsController` mounts `POST /contacts` with request/response validation powered by TypeBox schemas.
- 🔄 Delegates business logic to `@anarchitects/contacts-nest-application` and only returns transport-friendly DTOs.
- 🧪 Jest specs cover controller orchestration through dependency mocks.

## Installation

```bash
npm install @anarchitects/contacts-nest-presentation @nestjs/platform-fastify
# or
yarn add @anarchitects/contacts-nest-presentation @nestjs/platform-fastify
```

## Usage

```ts
import { Module } from '@nestjs/common';
import { ContactsNestPresentationModule } from '@anarchitects/contacts-nest-presentation';
import { ContactsNestApplicationModule } from '@anarchitects/contacts-nest-application';

@Module({
  imports: [ContactsNestApplicationModule, ContactsNestPresentationModule],
})
export class ApiModule {}
```

The controller relies on DTOs from `@anarchitects/contacts-ts-dtos` to generate Fastify-compatible schemas via `@nestjs/platform-fastify`. Combine it with the infrastructure adapters that implement the required ports to build a complete stack.

## Nx targets (maintainers)

```bash
yarn nx test contacts-nest-presentation
yarn nx build contacts-nest-presentation
```

Keep the controller specs green before publishing new versions.
