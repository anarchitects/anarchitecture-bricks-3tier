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
          encryption: {
            ...configOptions.presentation?.application?.encryption,
            ...overrides.presentation?.application?.encryption,
          },
          engineOptions: {
            ...configOptions.presentation?.application?.engineOptions,
            ...overrides.presentation?.application?.engineOptions,
            persistence: {
              ...configOptions.presentation?.application?.engineOptions
                ?.persistence,
              ...overrides.presentation?.application?.engineOptions
                ?.persistence,
              separateDatabase: {
                ...configOptions.presentation?.application?.engineOptions
                  ?.persistence?.separateDatabase,
                ...overrides.presentation?.application?.engineOptions
                  ?.persistence?.separateDatabase,
              },
            },
          },
          persistence: {
            ...configOptions.presentation?.application?.persistence,
            ...overrides.presentation?.application?.persistence,
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
