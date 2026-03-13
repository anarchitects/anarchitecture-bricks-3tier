import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FormsInfrastructureMailerModule } from './infrastructure-mailer';
import { FormsPresentationModule } from './presentation';
import {
  DEFAULT_FORMS_MAILER_PROVIDER,
  DEFAULT_FORMS_PERSISTENCE,
  formsConfig,
  mapFormsConfigToFormsModuleOptions,
} from './config';
import type { FormsModuleOptions } from './config';

export type { FormsModuleFeatures, FormsModuleOptions } from './config';

@Module({})
export class FormsModule {
  static forRoot(options: FormsModuleOptions = {}): DynamicModule {
    const presentationModule = FormsPresentationModule.forRoot(
      options.presentation,
    );
    const mailerModule = FormsInfrastructureMailerModule.forRoot(
      options.mailer,
    );

    return {
      module: FormsModule,
      imports: [presentationModule, mailerModule],
      exports: [presentationModule, mailerModule],
    };
  }

  static forRootFromConfig(overrides: FormsModuleOptions = {}): DynamicModule {
    const configOptions = mapFormsConfigToFormsModuleOptions(formsConfig());
    const resolvedPersistence = {
      persistence:
        overrides.presentation?.application?.persistence?.persistence ??
        configOptions.presentation?.application?.persistence?.persistence ??
        DEFAULT_FORMS_PERSISTENCE,
    };
    const resolvedMailer = {
      provider:
        overrides.mailer?.provider ??
        configOptions.mailer?.provider ??
        DEFAULT_FORMS_MAILER_PROVIDER,
    };

    const moduleDefinition = this.forRoot({
      presentation: {
        ...configOptions.presentation,
        ...overrides.presentation,
        application: {
          ...configOptions.presentation?.application,
          ...overrides.presentation?.application,
          persistence: resolvedPersistence,
        },
      },
      mailer: {
        ...configOptions.mailer,
        ...overrides.mailer,
        ...resolvedMailer,
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
