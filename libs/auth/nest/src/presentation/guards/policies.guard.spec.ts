import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { PoliciesService } from '../../application/services/policies.service';
import { PoliciesGuard } from './policies.guard';

describe('PoliciesGuard', () => {
  let guard: PoliciesGuard;

  const mockPoliciesService = {
    rulesForUser: jest.fn(),
    buildAbilityForUser: jest.fn(),
    assertCanAttemptRoutePolicies: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    getAllAndMerge: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoliciesGuard,
        { provide: PoliciesService, useValue: mockPoliciesService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<PoliciesGuard>(PoliciesGuard);
  });

  const createExecutionContext = (user?: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => 'handler',
      getClass: () => 'class',
    }) as unknown as ExecutionContext;

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('allows requests without policy metadata', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(guard.canActivate(createExecutionContext())).resolves.toBe(
      true,
    );
    expect(mockPoliciesService.rulesForUser).not.toHaveBeenCalled();
  });

  it('throws when the user is missing for protected routes', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([
      { action: 'update', subject: 'Post' },
    ]);

    await expect(guard.canActivate(createExecutionContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('delegates route pass checks to PoliciesService', async () => {
    const policies = [{ action: 'update', subject: 'Post' }];
    const user = { id: 'user-1' };
    mockReflector.getAllAndOverride.mockReturnValue([
      { action: 'update', subject: 'Post' },
    ]);
    mockPoliciesService.assertCanAttemptRoutePolicies.mockResolvedValue(
      undefined,
    );

    await expect(guard.canActivate(createExecutionContext(user))).resolves.toBe(
      true,
    );
    expect(
      mockPoliciesService.assertCanAttemptRoutePolicies,
    ).toHaveBeenCalledWith(user, policies);
  });

  it('bubbles failed route pass checks', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([
      { action: 'update', subject: 'Post' },
    ]);
    mockPoliciesService.assertCanAttemptRoutePolicies.mockRejectedValue(
      new ForbiddenException(),
    );

    await expect(
      guard.canActivate(createExecutionContext({ id: 'user-1' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('bubbles malformed persisted policy failures instead of allowing access', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([
      { action: 'update', subject: 'Post' },
    ]);
    mockPoliciesService.assertCanAttemptRoutePolicies.mockRejectedValue(
      new Error('Malformed persisted policy rule payload'),
    );

    await expect(
      guard.canActivate(createExecutionContext({ id: 'user-1' })),
    ).rejects.toThrow('Malformed persisted policy rule payload');
  });
});
