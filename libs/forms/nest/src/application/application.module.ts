import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FormsService } from './services/forms.service';
import { SubmissionsService } from './services/submissions.service';
import { FormsInfrastructurePersistenceModule } from '../infrastructure-persistence';
import {
  DEFAULT_FORMS_PERSISTENCE,
  formsConfig,
  mapFormsConfigToApplicationModuleOptions,
} from '../config';
import type { FormsApplicationModuleOptions } from '../config';

@Module({
  imports: [FormsInfrastructurePersistenceModule.forRoot()],
  providers: [FormsService, SubmissionsService],
  exports: [FormsService, SubmissionsService],
})
export class FormsApplicationModule {
  static forRoot(options: FormsApplicationModuleOptions = {}): DynamicModule {
    if (!options.persistence) {
      return {
        module: FormsApplicationModule,
      };
    }

    return {
      module: FormsApplicationModule,
      imports: [
        FormsInfrastructurePersistenceModule.forRoot(options.persistence),
      ],
    };
  }

  static forRootFromConfig(
    overrides: FormsApplicationModuleOptions = {},
  ): DynamicModule {
    const configOptions =
      mapFormsConfigToApplicationModuleOptions(formsConfig());
    const resolvedPersistence = {
      persistence:
        overrides.persistence?.persistence ??
        configOptions.persistence?.persistence ??
        DEFAULT_FORMS_PERSISTENCE,
    };

    const moduleDefinition = this.forRoot({
      persistence: resolvedPersistence,
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
