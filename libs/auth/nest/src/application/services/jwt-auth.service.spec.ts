import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthUserRepository } from '../../infrastructure-persistence/repositories/auth-user.repository';
import { HashService } from './hash.service';
import { JwtAuthService } from './jwt-auth.service';

describe('JwtAuthService', () => {
  let service: JwtAuthService;

  const mockHashService = {
    hash: jest.fn().mockResolvedValue('hashedPassword'),
    compare: jest.fn().mockResolvedValue(true),
  };

  const mockAuthUserRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('signedToken'),
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthService,
        { provide: HashService, useValue: mockHashService },
        { provide: AuthUserRepository, useValue: mockAuthUserRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<JwtAuthService>(JwtAuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('delegates engine-backed login behavior through the orchestration seam', async () => {
    const dto = { credential: 'testuser', password: 'password123' };
    mockAuthUserRepository.findOne.mockResolvedValueOnce({
      id: 'user-id',
      passwordHash: 'hashedPassword',
    });

    await expect(service.login(dto)).resolves.toEqual({
      accessToken: 'signedToken',
      refreshToken: 'signedToken',
    });
    expect(mockHashService.compare).toHaveBeenCalledWith(
      'password123',
      'hashedPassword',
    );
    expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
  });

  it('retains non-engine orchestration behavior for registration', async () => {
    const dto = {
      userName: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    await expect(service.registerUser(dto)).resolves.toEqual({ success: true });
    expect(mockHashService.hash).toHaveBeenCalledWith('password123');
    expect(mockAuthUserRepository.create).toHaveBeenCalled();
  });
});
