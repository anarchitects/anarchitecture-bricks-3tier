# @anarchitects/common-nest-config-mailer

A NestJS configuration module for email services, providing type-safe configuration management for
mailer infrastructure.

## Overview

This library provides standardized configuration for email/mailer services in NestJS applications.
It offers type-safe configuration schemas, validation, and dependency injection tokens for email
service providers.

## Features

- 🔧 Type-safe mailer configuration with validation
- 📧 Support for multiple email providers (SMTP, SendGrid, etc.)
- 🏗️ NestJS ConfigModule integration
- 🔒 Environment variable validation
- 🧪 Test configuration helpers

## Installation

```bash
npm install @anarchitects/common-nest-config-mailer
```

## Usage

### Basic Setup

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerConfigModule, mailerConfig } from '@anarchitects/common-nest-config-mailer';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [mailerConfig],
    }),
    MailerConfigModule,
  ],
})
export class AppModule {}
```

### Configuration

Set the following environment variables:

```env
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your-email@example.com
MAIL_PASS=your-password
MAIL_FROM=noreply@example.com
MAIL_SECURE=false
```

### Using in Services

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { MAILER_CONFIG, MailerConfig } from '@anarchitects/common-nest-config-mailer';

@Injectable()
export class EmailService {
  constructor(@Inject(MAILER_CONFIG) private config: MailerConfig) {}

  async sendEmail(to: string, subject: string, body: string) {
    // Use this.config.host, this.config.port, etc.
  }
}
```

## Configuration Schema

```typescript
interface MailerConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}
```

## License

Released under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
