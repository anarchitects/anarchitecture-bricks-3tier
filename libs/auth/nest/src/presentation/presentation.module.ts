import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { AuthApplicationModule } from '../application';
import { PoliciesGuard } from './guards/policies.guard';
import { ResourceAuthorizationGuard } from './guards/resource-authorization.guard';
import { JwtAuthPluginController } from '../infrastructure-engine/better-auth/plugins/jwt/jwt-auth-plugin.controller';
import {
  authConfig,
  mapAuthConfigToPresentationModuleOptions,
} from '../config';
import type { AuthPresentationModuleOptions } from '../config';

@Module({
  controllers: [AuthController],
  providers: [PoliciesGuard, ResourceAuthorizationGuard],
  exports: [PoliciesGuard, ResourceAuthorizationGuard],
})
export class AuthPresentationModule {
  static forRoot(options: AuthPresentationModuleOptions = {}): DynamicModule {
    const jwtPluginController = options.application?.plugins?.jwt?.enabled
      ? [JwtAuthPluginController]
      : [];

    return {
      module: AuthPresentationModule,
      imports: [AuthApplicationModule.forRoot(options.application)],
      controllers: jwtPluginController,
      exports: [AuthApplicationModule],
    };
  }

  static forRootFromConfig(
    overrides: AuthPresentationModuleOptions = {},
  ): DynamicModule {
    const configOptions =
      mapAuthConfigToPresentationModuleOptions(authConfig());
    const moduleDefinition = this.forRoot({
      ...configOptions,
      ...overrides,
      application: {
        ...configOptions.application,
        ...overrides.application,
        betterAuth: {
          ...configOptions.application?.betterAuth,
          ...overrides.application?.betterAuth,
          callbackUrls: {
            ...configOptions.application?.betterAuth?.callbackUrls,
            ...overrides.application?.betterAuth?.callbackUrls,
          },
        },
        encryption: {
          ...configOptions.application?.encryption,
          ...overrides.application?.encryption,
        },
        plugins: {
          ...configOptions.application?.plugins,
          ...overrides.application?.plugins,
          jwt: {
            ...configOptions.application?.plugins?.jwt,
            ...overrides.application?.plugins?.jwt,
          },
          passkeys: {
            ...configOptions.application?.plugins?.passkeys,
            ...overrides.application?.plugins?.passkeys,
          },
          social: {
            ...configOptions.application?.plugins?.social,
            ...overrides.application?.plugins?.social,
          },
          oidc: {
            ...configOptions.application?.plugins?.oidc,
            ...overrides.application?.plugins?.oidc,
          },
        },
      },
    });

    return {
      ...moduleDefinition,
      imports: [
        ConfigModule.forFeature(authConfig),
        ...(moduleDefinition.imports ?? []),
      ],
    };
  }
}
