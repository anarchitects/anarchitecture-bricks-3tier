import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionEntity } from './entities/submission.entity';
import { SUBMISSIONS_REPOSITORY } from '../application';
import { TypeOrmSubmissionsRepository } from './repositories/typeorm-submissions.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SubmissionEntity])],
  providers: [
    {
      provide: SUBMISSIONS_REPOSITORY,
      useFactory: (repo: TypeOrmSubmissionsRepository) => repo,
      inject: [TypeOrmSubmissionsRepository],
    },
  ],
  exports: [SUBMISSIONS_REPOSITORY, TypeOrmModule],
})
export class PersistenceModule {}
