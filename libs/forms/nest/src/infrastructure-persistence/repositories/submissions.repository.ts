import { Submission } from '@anarchitects/forms-ts/models';

export abstract class SubmissionsRepository {
  abstract createSubmission(input: Partial<Submission>): Promise<Submission>;
  abstract getSubmissions(): Promise<Submission[]>;
  abstract getSubmission(
    options?: Partial<Submission>
  ): Promise<Submission | null>;
}
