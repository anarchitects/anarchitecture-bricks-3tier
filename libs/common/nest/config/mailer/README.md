# @anarchitects/common-nest-config-mailer

Typed configuration primitives for wiring mailer settings into your NestJS applications. This package exposes a strongly typed `mailerConfig` registration and helper decorators so downstream services can consume SMTP metadata without touching `process.env` directly.

## Features

- 💡 Registers a `ConfigModule` feature with sensible defaults for local development.
- ✅ Provides the `MailerConfig` type and `InjectMailerConfig()` decorator for injection-friendly access.
- 🔒 Normalises boolean and numeric configuration so your services receive the right shape every time.

## Installation

```bash
npm install @anarchitects/common-nest-config-mailer
# or
yarn add @anarchitects/common-nest-config-mailer
```

## Getting started

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InjectMailerConfig, MailerConfig, mailerConfig } from '@anarchitects/common-nest-config-mailer';

@Module({
  imports: [ConfigModule.forFeature(mailerConfig)],
})
export class MailModule {
  constructor(@InjectMailerConfig() private readonly cfg: MailerConfig) {
    // cfg.host, cfg.port, cfg.secure, ... are fully typed
  }
}
```

Inject the config anywhere you need SMTP credentials (for example, when bootstrapping `@nestjs-modules/mailer`).

## Environment variables

| Variable              | Type    | Default               | Description                              |
| --------------------- | ------- | --------------------- | ---------------------------------------- |
| `MAILER_HOST`         | string  | `smtp.example.com`    | Mail server host name.                   |
| `MAILER_PORT`         | number  | `587`                 | Port used to connect to the mail server. |
| `MAILER_SECURE`       | boolean | `false`               | Enables TLS/SSL.                         |
| `MAILER_USER`         | string  | `user@example.com`    | Auth username.                           |
| `MAILER_PASS`         | string  | `password`            | Auth password or token.                  |
| `MAILER_DEFAULT`      | string  | `default@example.com` | Default “from” email address.            |
| `MAILER_IGNORE_TLS`   | boolean | `false`               | Skip TLS validation (useful in dev).     |
| `MAILER_TEMPLATE_DIR` | string  | `templates`           | Folder where mail templates live.        |

All values are parsed and typed at config-registration time, so the rest of your code can rely on consistent shapes.

## Nx targets (maintainers)

```bash
yarn nx test common-nest-config-mailer
yarn nx build common-nest-config-mailer
```

Run tests before publishing to keep schema coverage in sync.
