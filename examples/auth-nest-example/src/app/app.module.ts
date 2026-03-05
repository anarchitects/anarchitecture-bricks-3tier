import { Module } from '@nestjs/common';
import { AuthService, PoliciesService } from '@anarchitects/auth-nest/application';
import { AuthController } from '@anarchitects/auth-nest/presentation';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExampleAuthService } from './example-auth.service';
import { ExamplePoliciesService } from './example-policies.service';
import { ProtectedController } from './protected.controller';
import { AuthContextGuard } from './auth-context.guard';

@Module({
  imports: [],
  controllers: [AppController, AuthController, ProtectedController],
  providers: [
    AppService,
    ExampleAuthService,
    ExamplePoliciesService,
    AuthContextGuard,
    {
      provide: APP_GUARD,
      useExisting: AuthContextGuard,
    },
    {
      provide: AuthService,
      useExisting: ExampleAuthService,
    },
    {
      provide: PoliciesService,
      useExisting: ExamplePoliciesService,
    },
  ],
})
export class AppModule {}
