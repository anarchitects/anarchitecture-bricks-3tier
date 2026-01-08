import { Test, TestingModule } from '@nestjs/testing';
import { BcryptHashService } from './bcrypt-hash.service';

describe('BcryptHashService', () => {
  let service: BcryptHashService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BcryptHashService],
    }).compile();

    service = module.get<BcryptHashService>(BcryptHashService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash and compare passwords correctly', async () => {
    const password = 'mySecurePassword';
    const hash = await service.hash(password);
    expect(hash).toBeDefined();
    expect(hash).not.toEqual(password);

    const isMatch = await service.compare(password, hash);
    expect(isMatch).toBe(true);

    const isNotMatch = await service.compare('wrongPassword', hash);
    expect(isNotMatch).toBe(false);
  });
});
