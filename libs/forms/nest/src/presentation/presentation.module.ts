import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubmissionsController } from './controllers/submissions.controller';
import { FormsController } from './controllers/forms.controller';
import { FormsApplicationModule } from '../application';
import {
  DEFAULT_FORMS_PERSISTENCE,
  formsConfig,
  mapFormsConfigToPresentationModuleOptions,
} from '../config';
import type { FormsPresentationModuleOptions } from '../config';

@Module({
  imports: [FormsApplicationModule.forRoot()],
  controllers: [SubmissionsController, FormsController],
  exports: [FormsApplicationModule],
})
export class FormsPresentationModule {
  static forRoot(options: FormsPresentationModuleOptions = {}): DynamicModule {
    if (!options.application) {
      return {
        module: FormsPresentationModule,
      };
    }

    return {
      module: FormsPresentationModule,
      imports: [FormsApplicationModule.forRoot(options.application)],
    };
  }

  static forRootFromConfig(
    overrides: FormsPresentationModuleOptions = {},
  ): DynamicModule {
    const configOptions =
      mapFormsConfigToPresentationModuleOptions(formsConfig());
    const resolvedPersistence = {
      persistence:
        overrides.application?.persistence?.persistence ??
        configOptions.application?.persistence?.persistence ??
        DEFAULT_FORMS_PERSISTENCE,
    };

    const moduleDefinition = this.forRoot({
      application: {
        ...configOptions.application,
        ...overrides.application,
        persistence: resolvedPersistence,
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
