import { Test, TestingModule } from '@nestjs/testing';
import { FormsService } from './forms.service';

describe('FormsService', () => {
  let service: FormsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormsService],
    }).compile();

    service = module.get<FormsService>(FormsService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('getDefinition', () => {
    it('should return the form definition for contact_default v1', async () => {
      const result = await service.getDefinition('contact_default', 1);
      expect(result).toHaveProperty('config');
      expect(result).toHaveProperty('schema');
    });
    it('should throw an error for unknown form', async () => {
      await expect(service.getDefinition('unknown_form', 1)).rejects.toThrow(
        'Unknown form'
      );
    });
  });
});
