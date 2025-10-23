import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionEntity } from './entities/submission.entity';
import { SubmissionsRepository } from './repositories/submissions.repository';
import { TypeOrmSubmissionsRepository } from './repositories/typeorm-submissions.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SubmissionEntity])],
  providers: [
    {
      provide: SubmissionsRepository,
      useFactory: (repo: TypeOrmSubmissionsRepository) => repo,
      inject: [TypeOrmSubmissionsRepository],
    },
  ],
  exports: [SubmissionsRepository, TypeOrmModule],
})
export class FormsInfrastructurePersistenceModule {}
