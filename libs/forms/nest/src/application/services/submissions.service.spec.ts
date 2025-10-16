import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import { SubmissionsService } from './submissions.service';
import { FormConfig, Submission } from '@anarchitects/forms-ts/models';
import { SUBMISSIONS_REPOSITORY } from '../ports/submissions.repository.port';
import { MAILER_PORT } from '../ports/mailer.port';
import { FormsService } from './forms.service';

describe('SubmissionsService', () => {
  let service: SubmissionsService;

  const mockSubmission: Submission = {
    id: faker.string.uuid(),
    formId: 'contact_default',
    formVersion: 1,
    payload: { name: faker.person.firstName(), email: faker.internet.email() },
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };
  const mockSubmissionsRepository = {
    createSubmission: jest.fn().mockResolvedValue(mockSubmission),
  };

  const mockMailerPort = {
    sendTemplate: jest.fn(),
  };

  const mockFormConfig: FormConfig = {
    id: 'contact_default',
    version: 1,
    fields: [
      { name: 'name', kind: 'string', required: true },
      { name: 'email', kind: 'email', required: true },
    ],
    delivery: {
      adminEmail: faker.internet.email(),
      subject: 'New contact form submission',
      templateId: 'contact_admin',
      autoReply: {
        enabled: true,
        subject: 'Thank you for contacting us',
        templateId: 'contact_user',
      },
    },
  };

  const mockFormsService = {
    getDefinition: jest.fn().mockResolvedValue({ config: mockFormConfig }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        {
          provide: SUBMISSIONS_REPOSITORY,
          useValue: mockSubmissionsRepository,
        },
        { provide: MAILER_PORT, useValue: mockMailerPort },
        { provide: FormsService, useValue: mockFormsService },
      ],
    }).compile();

    service = module.get<SubmissionsService>(SubmissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('submit', () => {
    it('should create a submission using the repository', async () => {
      const submissionData = {
        formId: 'contact_default',
        formVersion: 1,
        payload: {
          name: faker.person.firstName(),
          email: faker.internet.email(),
        },
      };
      const result = await service.submit(submissionData);
      expect(result).toBe(mockSubmission);
      expect(mockSubmissionsRepository.createSubmission).toHaveBeenCalledWith(
        submissionData
      );
      expect(mockFormsService.getDefinition).toHaveBeenCalledWith(
        'contact_default',
        1
      );
      expect(mockMailerPort.sendTemplate).toHaveBeenCalled();
    });
  });
});
