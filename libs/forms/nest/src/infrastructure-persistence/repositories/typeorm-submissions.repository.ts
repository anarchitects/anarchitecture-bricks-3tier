import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Submission } from '@anarchitects/forms-ts/models';
import { SubmissionsRepository } from '../../application';
import { SubmissionEntity } from '../entities/submission.entity';

@Injectable()
export class TypeOrmSubmissionsRepository extends SubmissionsRepository {
  constructor(
    @InjectRepository(SubmissionEntity)
    private readonly repo: Repository<SubmissionEntity>
  ) {
    super();
  }

  async createSubmission(input: Partial<Submission>): Promise<Submission> {
    const submission = await this.repo.create(input);
    return this.repo.save(submission);
  }

  async getSubmissions(): Promise<Submission[]> {
    return this.repo.find();
  }
  async getSubmission(options?: Partial<Submission>): Promise<Submission> {
    const submission = await this.repo.findOne({ where: options });
    if (!submission) {
      throw new NotFoundException(
        `Submission with options #${options} bot found`
      );
    }
    return submission;
  }
}
