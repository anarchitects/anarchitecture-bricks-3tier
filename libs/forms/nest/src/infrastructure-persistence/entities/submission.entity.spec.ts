import { SubmissionEntity } from './submission.entity';
import { faker } from '@faker-js/faker';

describe('SubmissionEntity', () => {
  const mockSubmission = {
    email: faker.internet.email(),
    name: faker.person.fullName(),
    message: faker.lorem.sentence(),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };
  it('should be defined', () => {
    expect(new SubmissionEntity(mockSubmission)).toBeDefined();
  });
  it('should create an instance with given partial data', () => {
    const submissionEntity = new SubmissionEntity(mockSubmission);
    expect(submissionEntity).toMatchObject(mockSubmission);
  });
  it('should generate an id if not provided', () => {
    const submissionEntity = new SubmissionEntity();
    submissionEntity.generateId();
    expect(submissionEntity.id).toBeDefined();
  });
});
