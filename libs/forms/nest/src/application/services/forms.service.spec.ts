import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FormConfig } from '@anarchitects/forms-ts/models';
import { FormsService } from './forms.service';
import { FormConfigsRepository } from '../../infrastructure-persistence';

describe('FormsService', () => {
  let service: FormsService;

  const mockFormConfig: FormConfig = {
    id: 'contact_default',
    version: 1,
    fields: [
      {
        name: 'email',
        kind: 'email',
        required: true,
      },
    ],
  };

  const mockFormConfigsRepository = {
    getFormConfig: jest.fn().mockResolvedValue(mockFormConfig),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormsService,
        {
          provide: FormConfigsRepository,
          useValue: mockFormConfigsRepository,
        },
      ],
    }).compile();

    service = module.get<FormsService>(FormsService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('getDefinition', () => {
    it('should return config and schema from the repository', async () => {
      const result = await service.getDefinition('contact_default', 1);
      expect(result).toHaveProperty('config');
      expect(result).toHaveProperty('schema');
      expect(result.config).toEqual(mockFormConfig);
      expect(mockFormConfigsRepository.getFormConfig).toHaveBeenCalledWith(
        'contact_default',
        1,
      );
    });

    it('should throw NotFoundException for unknown form config', async () => {
      mockFormConfigsRepository.getFormConfig.mockRejectedValueOnce(
        new NotFoundException('Form config unknown_form@1 not found'),
      );

      await expect(service.getDefinition('unknown_form', 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
