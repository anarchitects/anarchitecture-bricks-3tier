import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  CommonMailerNoopModule,
  CommonNodeMailerModule,
} from '@anarchitects/common-nest-mailer';
import {
  authConfig,
  mapAuthConfigToMailerModuleOptions,
  resolveAuthMailerModuleOptions,
} from '../config';
import type { AuthMailerModuleOptions } from '../config';

@Global()
@Module({
  imports: [CommonNodeMailerModule],
  exports: [CommonNodeMailerModule],
})
export class AuthMailerModule {
  static forRoot(options: AuthMailerModuleOptions = {}): DynamicModule {
    const resolvedOptions = resolveAuthMailerModuleOptions(options);

    if (!resolvedOptions.features.enabled) {
      return {
        module: CommonMailerNoopModule,
      };
    }

    return {
      module: AuthMailerModule,
    };
  }

  static forRootFromConfig(
    overrides: AuthMailerModuleOptions = {},
  ): DynamicModule {
    const configOptions = mapAuthConfigToMailerModuleOptions(authConfig());
    const moduleDefinition = this.forRoot({
      features: {
        ...configOptions.features,
        ...overrides.features,
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
