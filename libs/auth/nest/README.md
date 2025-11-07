# @anarchitects/auth-nest

NestJS services, controllers, and infrastructure for the Anarchitecture authentication domain. This package wires contract-driven DTOs from `@anarchitects/auth-ts`, orchestrates user lifecycle flows (registration, activation, login/logout, password management, email verification), and persists auth state through pluggable repositories.

## Features

- Application layer (`JwtAuthService`, `BcryptHashService`, strategies) encapsulating business rules for tokens and password workflows.
- Presentation controllers that expose REST handlers using shared DTOs.
- Infrastructure persistence module (`PersistenceModule`) with TypeORM entities and repositories (users, roles, permissions, invalidated tokens).
- Configurable persistence adapters to swap implementations while preserving the application contract.

## Installation

```bash
npm install @anarchitects/auth-nest
# or
yarn add @anarchitects/auth-nest
```

Peer requirements:

- `@nestjs/common`, `@nestjs/core`, `@nestjs/jwt`, `@nestjs/typeorm`
- `@anarchitects/auth-ts` for DTOs and shared models

## Usage

### Importing modules

```ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PersistenceModule } from '@anarchitects/auth-nest/infrastructure-persistence';
import { PresentationModule } from '@anarchitects/auth-nest/presentation';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
    PersistenceModule.register({ persistence: 'typeorm' }),
    PresentationModule,
  ],
})
export class AuthApiModule {}
```

### Injecting services

```ts
import { Controller, Post, Body } from '@nestjs/common';
import { JwtAuthService } from '@anarchitects/auth-nest/application';
import { LoginRequestDTO } from '@anarchitects/auth-ts/dtos';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: JwtAuthService) {}

  @Post('login')
  login(@Body() dto: LoginRequestDTO) {
    return this.authService.login(dto);
  }
}
```

### Token invalidation

```ts
import { TypeormAuthUserRepository } from '@anarchitects/auth-nest/infrastructure-persistence';

await authUserRepository.invalidateTokens([hashedAccessToken, hashedRefreshToken], userId);
```

## Nx scripts

- `nx build auth-nest` – bundle the Nest library.
- `nx test auth-nest` – execute Jest unit tests.
- `nx lint auth-nest` – run ESLint checks.

## Development notes

- DTO shapes live in `@anarchitects/auth-ts`; update the contract and regenerate DTOs before extending this library.
- Default persistence is TypeORM with schema-qualified tables (see `libs/auth/nest/src/infrastructure-persistence`).
- Invalidated tokens use an unlogged cache table for quick revocation lookups.

## License

Licensed under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0). Unless required by applicable law or agreed to in writing, software is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
