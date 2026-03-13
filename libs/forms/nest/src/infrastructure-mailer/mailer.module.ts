import { DynamicModule, Global, Module } from '@nestjs/common';
import { CommonMailerModule } from '@anarchitects/common-nest-mailer';
import { ConfigModule } from '@nestjs/config';
import { formsConfig, mapFormsConfigToMailerModuleOptions } from '../config';
import type { FormsInfrastructureMailerModuleOptions } from '../config';

@Global()
@Module({})
export class FormsInfrastructureMailerModule {
  static forRoot(
    options: FormsInfrastructureMailerModuleOptions = {},
  ): DynamicModule {
    const commonMailerModule = CommonMailerModule.forRoot({
      provider: options.provider,
    });

    return {
      module: FormsInfrastructureMailerModule,
      imports: [commonMailerModule],
      exports: [commonMailerModule],
    };
  }

  static forRootFromConfig(
    overrides: FormsInfrastructureMailerModuleOptions = {},
  ): DynamicModule {
    const configOptions = mapFormsConfigToMailerModuleOptions(formsConfig());
    const moduleDefinition = this.forRoot({
      ...configOptions,
      ...overrides,
    });

    return {
      ...moduleDefinition,
      imports: [
        ConfigModule.forFeature(formsConfig),
        ...(moduleDefinition.imports ?? []),
      ],
    };
  }
}
