import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { AuthApplicationModule } from '../application';
import {
  authConfig,
  mapAuthConfigToPresentationModuleOptions,
} from '../config';
import type { AuthPresentationModuleOptions } from '../config';

@Module({
  controllers: [AuthController],
})
export class AuthPresentationModule {
  static forRoot(options: AuthPresentationModuleOptions = {}): DynamicModule {
    return {
      module: AuthPresentationModule,
      imports: [AuthApplicationModule.forRoot(options.application)],
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
        encryption: {
          ...configOptions.application?.encryption,
          ...overrides.application?.encryption,
        },
        persistence: {
          ...configOptions.application?.persistence,
          ...overrides.application?.persistence,
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
