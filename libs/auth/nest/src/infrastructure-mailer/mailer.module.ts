import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonMailerModule } from '@anarchitects/common-nest-mailer';
import {
  authConfig,
  mapAuthConfigToMailerModuleOptions,
  resolveAuthMailerModuleOptions,
} from '../config';
import type { AuthMailerModuleOptions } from '../config';

@Global()
@Module({})
export class AuthMailerModule {
  static forRoot(options: AuthMailerModuleOptions = {}): DynamicModule {
    const resolvedOptions = resolveAuthMailerModuleOptions(options);
    const commonMailerModule = CommonMailerModule.forRoot({
      provider: resolvedOptions.provider,
    });

    return {
      module: AuthMailerModule,
      imports: [commonMailerModule],
      exports: [commonMailerModule],
    };
  }

  static forRootFromConfig(
    overrides: AuthMailerModuleOptions = {},
  ): DynamicModule {
    const configOptions = mapAuthConfigToMailerModuleOptions(authConfig());
    const moduleDefinition = this.forRoot({
      ...configOptions,
      ...overrides,
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
