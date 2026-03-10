import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionEntity } from './entities/submission.entity';
import { FormConfigEntity } from './entities/form-config.entity';
import { SubmissionsRepository } from './repositories/submissions.repository';
import { TypeOrmSubmissionsRepository } from './repositories/typeorm-submissions.repository';
import { FormConfigsRepository } from './repositories/form-configs.repository';
import { TypeOrmFormConfigsRepository } from './repositories/typeorm-form-configs.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SubmissionEntity, FormConfigEntity])],
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
  exports: [SubmissionsRepository, FormConfigsRepository, TypeOrmModule],
})
export class FormsInfrastructurePersistenceModule {}
