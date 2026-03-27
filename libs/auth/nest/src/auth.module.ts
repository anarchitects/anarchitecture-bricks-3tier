import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthMailerModule } from './infrastructure-mailer';
import { AuthPresentationModule } from './presentation';
import { authConfig, mapAuthConfigToAuthModuleOptions } from './config';
import type { AuthModuleOptions } from './config';

export type { AuthModuleFeatures, AuthModuleOptions } from './config';

@Module({})
export class AuthModule {
  static forRoot(options: AuthModuleOptions = {}): DynamicModule {
    const presentationModule = AuthPresentationModule.forRoot(
      options.presentation,
    );
    const mailerModule = AuthMailerModule.forRoot(options.mailer);
    return {
      module: AuthModule,
      imports: [presentationModule, mailerModule],
      exports: [presentationModule, mailerModule],
    };
  }

  static forRootFromConfig(overrides: AuthModuleOptions = {}): DynamicModule {
    const configOptions = mapAuthConfigToAuthModuleOptions(authConfig());
    const moduleDefinition = this.forRoot({
      ...configOptions,
      ...overrides,
      presentation: {
        ...configOptions.presentation,
        ...overrides.presentation,
        application: {
          ...configOptions.presentation?.application,
          ...overrides.presentation?.application,
          betterAuth: {
            ...configOptions.presentation?.application?.betterAuth,
            ...overrides.presentation?.application?.betterAuth,
            callbackUrls: {
              ...configOptions.presentation?.application?.betterAuth
                ?.callbackUrls,
              ...overrides.presentation?.application?.betterAuth
                ?.callbackUrls,
            },
          },
          encryption: {
            ...configOptions.presentation?.application?.encryption,
            ...overrides.presentation?.application?.encryption,
          },
          plugins: {
            ...configOptions.presentation?.application?.plugins,
            ...overrides.presentation?.application?.plugins,
            jwt: {
              ...configOptions.presentation?.application?.plugins?.jwt,
              ...overrides.presentation?.application?.plugins?.jwt,
            },
            passkeys: {
              ...configOptions.presentation?.application?.plugins?.passkeys,
              ...overrides.presentation?.application?.plugins?.passkeys,
            },
            social: {
              ...configOptions.presentation?.application?.plugins?.social,
              ...overrides.presentation?.application?.plugins?.social,
            },
            oidc: {
              ...configOptions.presentation?.application?.plugins?.oidc,
              ...overrides.presentation?.application?.plugins?.oidc,
            },
          },
        },
      },
      mailer: {
        ...configOptions.mailer,
        ...overrides.mailer,
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
