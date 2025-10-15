import { SubmissionRecord } from '../types/submission-record.type';

export abstract class SubmissionsRepository {
  abstract createSubmission(
    input: Omit<SubmissionRecord, 'id' | 'createdAt'>
  ): Promise<SubmissionRecord>;
  abstract getSubmissions(): Promise<SubmissionRecord[]>;
  abstract getSubmission(
    options?: Partial<SubmissionRecord>
  ): Promise<SubmissionRecord | null>;
}

export const SUBMISSIONS_REPOSITORY = Symbol('SUBMISSIONS_REPOSITORY');
