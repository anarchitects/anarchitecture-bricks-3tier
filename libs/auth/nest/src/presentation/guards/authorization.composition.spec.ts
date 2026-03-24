import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AbilityFactory } from '../../application/factories/ability.factory';
import { AUTH_RESOURCE_AUTHORIZATION_LOADERS } from '../../application/resource-authorization.tokens';
import { PoliciesService } from '../../application/services/policies.service';
import { AUTHORIZED_RESOURCES_REQUEST_KEY } from '../authorized-resource.request';
import { PoliciesGuard } from './policies.guard';
import { ResourceAuthorizationGuard } from './resource-authorization.guard';

describe('authorization guard composition', () => {
  type Handler = (...args: never[]) => unknown;

  let policiesGuard: PoliciesGuard;
  let resourceAuthorizationGuard: ResourceAuthorizationGuard;

  const mockPoliciesService = {
    rulesForUser: jest.fn(),
    buildAbilityForUser: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    getAllAndMerge: jest.fn(),
  };

  const postLoader = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoliciesGuard,
        ResourceAuthorizationGuard,
        { provide: PoliciesService, useValue: mockPoliciesService },
        { provide: Reflector, useValue: mockReflector },
        {
          provide: AUTH_RESOURCE_AUTHORIZATION_LOADERS,
          useValue: { Post: postLoader },
        },
      ],
    }).compile();

    policiesGuard = module.get<PoliciesGuard>(PoliciesGuard);
    resourceAuthorizationGuard = module.get<ResourceAuthorizationGuard>(
      ResourceAuthorizationGuard,
    );
  });

  const createExecutionContext = (
    request: Record<string, unknown>,
    handler: Handler,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => handler,
      getClass: () => class TestController {},
    }) as unknown as ExecutionContext;

  it('runs coarse route checks before concrete resource checks and attaches the loaded resource', async () => {
    const abilityFactory = new AbilityFactory();
    const request = {
      user: { id: 'user-1' },
      params: { postId: 'post-1' },
    };
    const handler = () => true;

    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === 'policies') {
        return [{ action: 'update', subject: 'Post' }];
      }
      if (key === 'authorize-resource') {
        return [{ action: 'update', subject: 'Post', idParam: 'postId' }];
      }
      return undefined;
    });
    mockPoliciesService.rulesForUser.mockResolvedValue([
      {
        action: 'update',
        subject: 'Post',
        conditions: { authorId: 'user-1' },
      },
    ]);
    mockPoliciesService.buildAbilityForUser.mockResolvedValue(
      abilityFactory.buildAbility([
        {
          action: 'update',
          subject: 'Post',
          conditions: { authorId: 'user-1' },
        },
      ]),
    );
    postLoader.mockResolvedValue({ id: 'post-1', authorId: 'user-1' });

    await expect(
      policiesGuard.canActivate(createExecutionContext(request, handler)),
    ).resolves.toBe(true);
    await expect(
      resourceAuthorizationGuard.canActivate(
        createExecutionContext(request, handler),
      ),
    ).resolves.toBe(true);

    expect(
      (request as Record<string, unknown>)[AUTHORIZED_RESOURCES_REQUEST_KEY],
    ).toEqual({
      Post: { id: 'post-1', authorId: 'user-1' },
    });
  });
});
