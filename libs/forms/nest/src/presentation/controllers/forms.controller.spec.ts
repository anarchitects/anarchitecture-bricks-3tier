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

  const mockFormService = {
    getDefinition: jest.fn().mockResolvedValue(mockFormConfig),
  };

  beforeEach(async () => {
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
    it('should return form definition from the service', async () => {
      const formId = 'contact_default';
      const version = 1;
      const result = await controller.getFormDefinition(formId);
      expect(result).toBe(mockFormConfig);
      expect(mockFormService.getDefinition).toHaveBeenCalledWith(formId);
    });
  });
});
