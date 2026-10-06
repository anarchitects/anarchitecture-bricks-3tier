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
- Template directory resolution against a deployment base, with startup validation

## Installation

```bash
npm install @anarchitects/common-nest-mailer @nestjs/common @nestjs/config @nestjs-modules/mailer
# or
yarn add @anarchitects/common-nest-mailer @nestjs/common @nestjs/config @nestjs-modules/mailer
```

Peer requirements:

- `@nestjs/common`
- `@nestjs/config`
- `@nestjs-modules/mailer`

## Entry points and exports

- `mailerConfig`: `registerAs(...)` config namespace for `@nestjs/config`
- `MailerConfig`: public config type, including `templateDir: string` and optional `templateBaseDir?: string`
- `InjectMailerConfig()`: decorator helper for injecting config values
- `CommonMailerProvider`: provider mode union (`'node' | 'noop'`)
- `CommonMailerModuleOptions`: provider wiring options (`provider?: CommonMailerProvider`)
- `CommonMailerModule.forRoot(options?)`: provider wiring (`MailerPort -> NodeMailerAdapter|NoopMailerAdapter`)
- `CommonMailerModule.forProviderFromConfig(overrides?)`: config-driven provider wiring from `MAILER_PROVIDER`
- `CommonMailerModule.forRootFromConfig()`: config-driven root mail transport setup
- `CommonMailerModule.forRootAsync(...)`: pass-through setup for custom transports
- `MailerPort`: shared mailer port token/contract for domain adapters, including `sendMessage`, `send`, and `sendTemplate`
- `MailerMessage`: rendered HTML/text message contract with optional sender, reply-to, and headers
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
# Optional; leave empty for cwd-relative behavior.
MAILER_TEMPLATE_BASE_DIR=
```

## Configuration

Configure `mailerConfig` in `ConfigModule.forRoot({ load: [mailerConfig] })` and then choose provider wiring with either:

- `CommonMailerModule.forProviderFromConfig()` for env-driven provider selection
- `CommonMailerModule.forRoot({ provider: 'node' | 'noop' })` for explicit provider selection

## Template Directory Configuration

`CommonMailerModule.forRootFromConfig()` resolves the template directory before passing it to the Handlebars adapter. The fields are part of `MailerConfig`:

| Config field               | Environment variable       | Default                                         |
| -------------------------- | -------------------------- | ----------------------------------------------- |
| `templateDir: string`      | `MAILER_TEMPLATE_DIR`      | `templates` when unset                          |
| `templateBaseDir?: string` | `MAILER_TEMPLATE_BASE_DIR` | Unset; resolution falls back to `process.cwd()` |

Resolution follows these rules:

1. An absolute `templateDir` is passed through unchanged, regardless of `templateBaseDir`.
2. A relative `templateDir` resolves with `path.resolve(templateBaseDir, templateDir)` when the base is non-empty.
3. An absent or empty base resolves with `path.resolve(process.cwd(), templateDir)` for compatibility with existing cwd-relative configurations.

A relative base also depends on `process.cwd()` through Node's `path.resolve`. Use an absolute deployment base or derive one from the running application to make resolution independent of the launch directory. Empty means `''`; whitespace is a directory name, not an omitted value. An empty `templateDir` resolves to the base directory rather than the default `templates` directory.

### Existing cwd-relative configuration

```env
MAILER_TEMPLATE_DIR=templates
MAILER_TEMPLATE_BASE_DIR=
```

With `process.cwd()` equal to `/srv/app`, the resolved directory is `/srv/app/templates`. Omitting `MAILER_TEMPLATE_BASE_DIR` has the same effect. Launching from another working directory changes this result.

### Explicit deployment base

For a built application shipped with this layout:

```text
/srv/app/dist/
  main.js
  templates/
    contact.hbs
```

configure:

```env
MAILER_TEMPLATE_BASE_DIR=/srv/app/dist
MAILER_TEMPLATE_DIR=templates
```

The resolved directory is `/srv/app/dist/templates`, even when PM2, systemd, or a container starts the process with cwd `/` or `/var/run`. A fixed absolute base must still match the deployment location; it does not automatically follow a moved directory.

### Absolute template directory

```env
MAILER_TEMPLATE_BASE_DIR=/srv/app/dist
MAILER_TEMPLATE_DIR=/srv/shared/mail-templates
```

The resolved directory remains `/srv/shared/mail-templates`; the base is ignored.

### Choosing the base in application code

`forRootFromConfig()` takes no options argument and reads the registered `mailerConfig`. `forRoot()` accepts provider selection only. To derive the template location in application code while using the config-driven setup, populate its environment inputs before loading the application module:

```ts
import { NestFactory } from '@nestjs/core';
import type { MailerConfig } from '@anarchitects/common-nest-mailer';

async function bootstrap() {
  const templateLocation = {
    templateDir: 'templates',
    templateBaseDir: __dirname,
  } satisfies Pick<MailerConfig, 'templateDir' | 'templateBaseDir'>;

  process.env['MAILER_TEMPLATE_DIR'] = templateLocation.templateDir;
  process.env['MAILER_TEMPLATE_BASE_DIR'] = templateLocation.templateBaseDir;

  // AppModule imports CommonMailerModule.forRootFromConfig().
  const { AppModule } = await import('./app.module');
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

void bootstrap();
```

This CommonJS example deliberately makes the application own both path settings. With the layout above, `__dirname` is `/srv/app/dist`. Moving the artifact to `/srv/releases/42/dist` makes the base `/srv/releases/42/dist` without editing the configuration. For an ESM entry point, derive the directory with `fileURLToPath(new URL('.', import.meta.url))` from `node:url`. In either case, the actual output layout must place templates at the configured relative path.

### Startup validation and ownership

During Nest configuration, `forRootFromConfig()` checks that the resolved path exists, is a directory, and passes Node's read/search access checks where supported by the OS. A missing path, a file, or an inaccessible directory rejects bootstrap before the mailer becomes usable. Errors identify the resolved path, for example:

```text
Invalid mailer template directory "/srv/app/dist/templates": path does not exist or cannot be accessed.
```

**Startup compatibility change:** configurations that previously booted with invalid template paths now fail immediately, even if no email is sent. This validation runs whenever `forRootFromConfig()` is imported; `MAILER_PROVIDER=noop` only controls provider wiring and does not disable that transport setup.

The check covers the directory at startup. It does not compile every template, guarantee individual files exist, monitor later filesystem changes, or verify SMTP connectivity. Missing templates or later permission changes can still fail when rendering a message.

The consuming application owns, copies, and ships its templates. Include them in the build artifact or mount them before bootstrap, with access for the runtime user. This package resolves and validates their location; it does not bundle or copy host templates.

### Migrating a checkout-specific absolute path

Replace a configuration such as:

```env
MAILER_TEMPLATE_DIR=/home/developer/old-checkout/templates
```

with a base matching the deployed artifact and a relative template directory:

```env
MAILER_TEMPLATE_BASE_DIR=/srv/app/dist
MAILER_TEMPLATE_DIR=templates
```

Ship `templates/` alongside `main.js` in that layout. If the deployment root itself moves, derive the base from the application as above, or have the deployment configuration supply the new base. Verify startup from a different cwd before sending a real message. Existing absolute paths remain supported when they intentionally refer to a stable shared location.

## Usage (Preferred)

Configure mail transport once at app root, then let domain mailer modules consume `MailerPort`.

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

`forRootAsync()` accepts upstream `@nestjs-modules/mailer` options unchanged. It does not apply `MailerConfig.templateBaseDir`, resolve relative `template.dir` values, or perform this package's directory validation. For custom template setup, the host must resolve and validate its directory before returning the options. The package's resolver and validator are internal helpers, not public exports.

For an in-memory transport without templates:

```ts
import { Module } from '@nestjs/common';
import { CommonMailerModule } from '@anarchitects/common-nest-mailer';

@Module({
  imports: [
    CommonMailerModule.forRootAsync({
      useFactory: () => ({
        transport: { jsonTransport: true },
        defaults: { from: 'noreply@example.com' },
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

## Rendered messages with alternatives and metadata

`MailerPort.sendMessage(message)` sends a transport-neutral `MailerMessage` with `to`, `subject`, at least one of `html`/`text`, and optional `from`, `replyTo`, and string-valued `headers`. Supply both bodies for multipart alternative messages. Omitted sender metadata uses the transport's configured defaults. These are message headers, not a custom SMTP envelope. Domains own rendering and business semantics; Common does not interpret the content.

```ts
await mailer.sendMessage({
  to: 'reader@example.com',
  subject: 'Your requested message',
  html: '<p>Hello</p>',
  text: 'Hello',
  from: 'Example <noreply@example.com>',
  replyTo: 'help@example.com',
  headers: { 'X-Application': 'example' },
});
```

Existing node/noop provider selection applies to this method. Node forwards the supported fields to the configured transport and propagates rejection; success returns `void`, not provider metadata. Noop deliberately resolves without delivery. Callers decide failure/retry policy. Configure provider timeouts at the transport layer. Metadata and rendered bodies are trusted application input; do not forward untrusted request headers or arbitrary transport options.

**Custom adapter compatibility:** `send` and `sendTemplate` keep their existing signatures and behavior. Implementations of `MailerPort` must now implement `sendMessage`, including test doubles. Forward both requested alternatives and metadata, or reject unsupported messages explicitly; never silently discard requested capabilities. The built-in node and noop adapters implement the new contract. This is a source-breaking contract extension for custom implementers and must be released accordingly through CI.

## Development notes

- Configure transport once at app root and keep domain modules adapter-focused.
- Use `MailerPort` as the cross-domain contract to avoid tight coupling to concrete providers.
- Keep shared module defaults safe for local/dev environments.

## License

Released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
