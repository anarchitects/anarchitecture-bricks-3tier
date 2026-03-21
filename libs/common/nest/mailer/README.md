# @anarchitects/common-nest-mailer

Shared typed mailer configuration, transport setup, and provider wiring for NestJS apps.

## Developer + AI Agent Start Here

- Read this README before generating mailer integration code with `@anarchitects/common-nest-mailer`.
- Configure transport once at app root (`CommonMailerModule.forRootFromConfig()`), then use provider wiring for domain adapters.
- Treat `MailerPort` as the cross-domain contract; keep domain modules decoupled from concrete mailer implementations.
- Use only public exports from this package and keep provider selection explicit (`node` or `noop`).

## Features

- Shared mailer config namespace + typed injection helpers
- Adapter wiring (`node` and `noop`) behind a common `MailerPort` contract
- Root transport setup helpers for deterministic app-level configuration

## Installation

```bash
npm install @anarchitects/common-nest-mailer @nestjs-modules/mailer
# or
yarn add @anarchitects/common-nest-mailer @nestjs-modules/mailer
```

## Entry points and exports

- `mailerConfig`: `registerAs(...)` config namespace for `@nestjs/config`
- `MailerConfig`: inferred config type (`ConfigType<typeof mailerConfig>`)
- `InjectMailerConfig()`: decorator helper for injecting config values
- `CommonMailerProvider`: provider mode union (`'node' | 'noop'`)
- `CommonMailerModuleOptions`: provider wiring options (`provider?: CommonMailerProvider`)
- `CommonMailerModule.forRoot(options?)`: provider wiring (`MailerPort -> NodeMailerAdapter|NoopMailerAdapter`)
- `CommonMailerModule.forProviderFromConfig(overrides?)`: config-driven provider wiring from `MAILER_PROVIDER`
- `CommonMailerModule.forRootFromConfig()`: config-driven root mail transport setup
- `CommonMailerModule.forRootAsync(...)`: pass-through setup for custom transports
- `MailerPort`: shared mailer port token/contract for domain adapters
- `NodeMailerAdapter`: shared concrete adapter using Nest `MailerService`
- `NoopMailerAdapter`: shared no-op implementation

## Environment Variables

```env
MAILER_PROVIDER=node
MAILER_HOST=smtp.example.com
MAILER_PORT=587
MAILER_SECURE=false
MAILER_USER=user@example.com
MAILER_PASS=super-secret
MAILER_DEFAULT=noreply@example.com
MAILER_IGNORE_TLS=false
MAILER_TEMPLATE_DIR=templates
```

## Configuration

Configure `mailerConfig` in `ConfigModule.forRoot({ load: [mailerConfig] })` and then choose provider wiring with either:

- `CommonMailerModule.forProviderFromConfig()` for env-driven provider selection
- `CommonMailerModule.forRoot({ provider: 'node' | 'noop' })` for explicit provider selection

## Usage (Preferred)

Configure mail transport once at app root, then let domain mailer modules consume `MailerService`.

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  CommonMailerModule,
  mailerConfig,
} from '@anarchitects/common-nest-mailer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mailerConfig],
    }),
    CommonMailerModule.forRootFromConfig(),
    CommonMailerModule.forProviderFromConfig(),
  ],
})
export class AppModule {}
```

## Explicit Provider Wiring

```ts
import { Module } from '@nestjs/common';
import { CommonMailerModule } from '@anarchitects/common-nest-mailer';

@Module({
  imports: [CommonMailerModule.forRoot({ provider: 'noop' })],
})
export class AppModule {}
```

## Custom Transport Setup

```ts
import { Module } from '@nestjs/common';
import { CommonMailerModule } from '@anarchitects/common-nest-mailer';

@Module({
  imports: [
    CommonMailerModule.forRootAsync({
      useFactory: () => ({
        transport: { jsonTransport: true },
        defaults: { from: 'noreply@example.com' },
        template: { dir: 'templates' },
      }),
    }),
  ],
})
export class AppModule {}
```

## Injecting Typed Config

```ts
import { Injectable } from '@nestjs/common';
import {
  InjectMailerConfig,
  MailerConfig,
} from '@anarchitects/common-nest-mailer';

@Injectable()
export class MailerSetupService {
  constructor(@InjectMailerConfig() private readonly config: MailerConfig) {}
}
```

## Development notes

- Configure transport once at app root and keep domain modules adapter-focused.
- Use `MailerPort` as the cross-domain contract to avoid tight coupling to concrete providers.
- Keep shared module defaults safe for local/dev environments.

## License

Released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
