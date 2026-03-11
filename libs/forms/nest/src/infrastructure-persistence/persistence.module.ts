import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionEntity } from './entities/submission.entity';
import { FormConfigEntity } from './entities/form-config.entity';
import { SubmissionsRepository } from './repositories/submissions.repository';
import { TypeOrmSubmissionsRepository } from './repositories/typeorm-submissions.repository';
import { FormConfigsRepository } from './repositories/form-configs.repository';
import { TypeOrmFormConfigsRepository } from './repositories/typeorm-form-configs.repository';
import {
  ConfigurableModuleClass,
  OPTIONS_TYPE,
} from './persistence.module-definition';

@Module({})
export class FormsInfrastructurePersistenceModule extends ConfigurableModuleClass {
  static forRoot(options: typeof OPTIONS_TYPE): DynamicModule {
    switch (options.persistence) {
      case 'typeorm':
        return {
          ...super.forRoot(options),
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
        throw new Error(`Unsupported persistence type: ${options.persistence}`);
    }
  }
}
