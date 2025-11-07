import { Test, TestingModule } from '@nestjs/testing';
import { PoliciesGuard } from './policies.guard';
import { PoliciesService } from '../../application/services/policies.service';
import { Reflector } from '@nestjs/core';

describe('PoliciesGuard', () => {
  let guard: PoliciesGuard;

  const mockPoliciesService = {
    buildAbilityForUser: jest.fn(),
    rulesForUser: jest.fn(),
    abilityFactory: {
      buildAbility: jest.fn(),
    },
    authUserRepository: {
      findOne: jest.fn(),
    },
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    getAllAndMerge: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoliciesGuard,
        { provide: PoliciesService, useValue: mockPoliciesService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<PoliciesGuard>(PoliciesGuard);
  });
  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
});
