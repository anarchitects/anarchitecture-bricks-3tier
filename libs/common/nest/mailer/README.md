# @anarchitects/common-nest-mailer

Shared typed mailer configuration and root mail transport setup for NestJS apps.

## What It Exports

- `mailerConfig`: `registerAs(...)` config namespace for `@nestjs/config`
- `MailerConfig`: inferred config type (`ConfigType<typeof mailerConfig>`)
- `InjectMailerConfig()`: decorator helper for injecting config values
- `CommonMailerModule.forRootFromConfig()`: config-driven root mail transport setup
- `CommonMailerModule.forRootAsync(...)`: pass-through setup for custom transports
- `MailerPort`: shared mailer port token/contract for domain adapters
- `NoopMailerAdapter`: shared no-op implementation
- `CommonMailerNoopModule`: provider module binding `MailerPort -> NoopMailerAdapter`

## Environment Variables

```env
MAILER_HOST=smtp.example.com
MAILER_PORT=587
MAILER_SECURE=false
MAILER_USER=user@example.com
MAILER_PASS=super-secret
MAILER_DEFAULT=noreply@example.com
MAILER_IGNORE_TLS=false
MAILER_TEMPLATE_DIR=templates
```

## Usage (Preferred)

Configure mail transport once at app root, then let domain mailer modules consume `MailerService`.

Domain mailer infrastructure modules are adapter-only and should not call
`MailerModule.forRootAsync(...)` themselves.

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonMailerModule, mailerConfig } from '@anarchitects/common-nest-mailer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mailerConfig],
    }),
    CommonMailerModule.forRootFromConfig(),
  ],
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
import { InjectMailerConfig, MailerConfig } from '@anarchitects/common-nest-mailer';

@Injectable()
export class MailerSetupService {
  constructor(@InjectMailerConfig() private readonly config: MailerConfig) {}
}
```

## License

Released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
