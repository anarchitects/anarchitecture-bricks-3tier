import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionsController } from './submissions.controller';
import { faker } from '@faker-js/faker';
import { Submission } from '@anarchitects/forms-ts/models';
import { SubmissionsService } from '../../application';

describe('SubmissionsController', () => {
  let controller: SubmissionsController;

  const mockSubmission: Submission = {
    id: faker.string.uuid(),
    formId: 'contact_default',
    formVersion: 1,
    payload: { name: faker.person.firstName(), email: faker.internet.email() },
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };

  const mockSubmissionsService = {
    submit: jest.fn().mockResolvedValue(mockSubmission),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubmissionsController],
      providers: [
        { provide: SubmissionsService, useValue: mockSubmissionsService },
      ],
    }).compile();

    controller = module.get<SubmissionsController>(SubmissionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('submitForm', () => {
    it('should submit form data using the service', async () => {
      const submissionData = {
        formId: 'contact_default',
        formVersion: 1,
        payload: {
          name: faker.person.firstName(),
          email: faker.internet.email(),
        },
      };
      const result = await controller.submitForm(submissionData);
      expect(result).toBe(mockSubmission);
      expect(mockSubmissionsService.submit).toHaveBeenCalledWith(
        submissionData
      );
    });
  });
});
