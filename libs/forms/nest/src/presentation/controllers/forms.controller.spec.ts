import { Test, TestingModule } from '@nestjs/testing';
import { FormsController } from './forms.controller';
import { faker } from '@faker-js/faker';
import { FormConfig } from '@anarchitects/forms-ts/models';
import { FormsService } from '../../application';

describe('FormsController', () => {
  let controller: FormsController;

  const mockFormConfig: FormConfig = {
    id: faker.string.uuid(),
    version: 1,
    fields: [
      { name: 'test', kind: 'string' as const },
      { name: 'email', kind: 'email' as const },
    ],
  };

  const mockFormDefinitionEnvelope = {
    config: mockFormConfig,
    schema: { type: 'object' },
  };

  const mockFormService = {
    getDefinition: jest.fn().mockResolvedValue(mockFormDefinitionEnvelope),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormsController],
      providers: [
        {
          provide: FormsService,
          useValue: mockFormService,
        },
      ],
    }).compile();

    controller = module.get<FormsController>(FormsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('getFormDefinition', () => {
    it('should return form definition from the service with explicit version', async () => {
      const formId = 'contact_default';
      const result = await controller.getFormDefinition(formId, {
        formVersion: 2,
      });
      expect(result).toBe(mockFormDefinitionEnvelope);
      expect(mockFormService.getDefinition).toHaveBeenCalledWith(formId, 2);
    });

    it('should default to version 1 when query is empty', async () => {
      const formId = 'contact_default';
      await controller.getFormDefinition(formId, {});
      expect(mockFormService.getDefinition).toHaveBeenCalledWith(formId, 1);
    });
  });
});
