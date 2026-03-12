import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionEntity } from './entities/submission.entity';
import { FormConfigEntity } from './entities/form-config.entity';
import { SubmissionsRepository } from './repositories/submissions.repository';
import { TypeOrmSubmissionsRepository } from './repositories/typeorm-submissions.repository';
import { FormConfigsRepository } from './repositories/form-configs.repository';
import { TypeOrmFormConfigsRepository } from './repositories/typeorm-form-configs.repository';
import {
  DEFAULT_FORMS_PERSISTENCE,
  formsConfig,
  mapFormsConfigToPersistenceModuleOptions,
} from '../config';
import type { FormsInfrastructurePersistenceModuleOptions } from '../config';
import { ConfigModule } from '@nestjs/config';
import {
  ConfigurableModuleClass,
  OPTIONS_TYPE,
} from './persistence.module-definition';

@Module({})
export class FormsInfrastructurePersistenceModule extends ConfigurableModuleClass {
  static forRoot(
    options?: FormsInfrastructurePersistenceModuleOptions,
  ): DynamicModule {
    const resolvedOptions: typeof OPTIONS_TYPE = {
      persistence: options?.persistence ?? DEFAULT_FORMS_PERSISTENCE,
    };

    switch (resolvedOptions.persistence) {
      case 'typeorm':
        return {
          ...super.forRoot(resolvedOptions),
          imports: [
            TypeOrmModule.forFeature([SubmissionEntity, FormConfigEntity]),
          ],
          providers: [
            TypeOrmSubmissionsRepository,
            TypeOrmFormConfigsRepository,
            {
              provide: SubmissionsRepository,
              useExisting: TypeOrmSubmissionsRepository,
            },
            {
              provide: FormConfigsRepository,
              useExisting: TypeOrmFormConfigsRepository,
            },
          ],
          exports: [
            SubmissionsRepository,
            FormConfigsRepository,
            TypeOrmModule,
          ],
        };
      default:
        throw new Error(
          `Unsupported persistence type: ${resolvedOptions.persistence}`,
        );
    }
  }

  static forRootFromConfig(
    overrides: Partial<FormsInfrastructurePersistenceModuleOptions> = {},
  ): DynamicModule {
    const configOptions =
      mapFormsConfigToPersistenceModuleOptions(formsConfig());
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
