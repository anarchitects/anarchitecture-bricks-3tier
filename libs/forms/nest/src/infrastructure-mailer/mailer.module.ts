import { DynamicModule, Global, Module } from '@nestjs/common';
import {
  CommonMailerNoopModule,
  CommonNodeMailerModule,
} from '@anarchitects/common-nest-mailer';
import { ConfigModule } from '@nestjs/config';
import {
  DEFAULT_FORMS_MAILER_ENABLED,
  formsConfig,
  mapFormsConfigToMailerModuleOptions,
} from '../config';
import type { FormsInfrastructureMailerModuleOptions } from '../config';

@Global()
@Module({
  imports: [CommonNodeMailerModule],
  exports: [CommonNodeMailerModule],
})
export class FormsInfrastructureMailerModule {
  static forRoot(
    options: FormsInfrastructureMailerModuleOptions = {},
  ): DynamicModule {
    const enabled = options.features?.enabled ?? DEFAULT_FORMS_MAILER_ENABLED;

    if (!enabled) {
      return {
        module: CommonMailerNoopModule,
      };
    }

    return {
      module: FormsInfrastructureMailerModule,
    };
  }

  static forRootFromConfig(
    overrides: FormsInfrastructureMailerModuleOptions = {},
  ): DynamicModule {
    const configOptions = mapFormsConfigToMailerModuleOptions(formsConfig());
    const moduleDefinition = this.forRoot({
      features: {
        ...configOptions.features,
        ...overrides.features,
      },
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
