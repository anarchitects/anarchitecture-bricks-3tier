import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AUTHORIZE_RESOURCE_KEY,
  POLICIES_KEY,
} from '@anarchitects/auth-declarations';
import { PoliciesService } from '../../application/services/policies.service';
import { ResourceAuthorizationService } from '../../application/services/resource-authorization.service';
import { AUTHORIZED_RESOURCES_REQUEST_KEY } from '../authorized-resource.request';
import { AuthorizationGuard } from './authorization.guard';

describe('AuthorizationGuard', () => {
  type Handler = (...args: never[]) => unknown;

  let guard: AuthorizationGuard;

  const mockPoliciesService = {
    assertCanAttemptRoutePoliciesForAuthUser: jest.fn(),
  };

  const mockResourceAuthorizationService = {
    authorizeResources: jest.fn(),
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
        AuthorizationGuard,
        { provide: PoliciesService, useValue: mockPoliciesService },
        {
          provide: ResourceAuthorizationService,
          useValue: mockResourceAuthorizationService,
        },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<AuthorizationGuard>(AuthorizationGuard);
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

  it('runs coarse route checks before concrete resource checks and attaches loaded resources', async () => {
    const request = {
      user: { id: 'user-1' },
      params: { postId: 'post-1' },
    };
    const handler = () => true;
    const policies = [{ action: 'update', subject: 'Post' }];
    const resources = [
      { action: 'update', subject: 'Post', idParam: 'postId' },
    ];
    const post = { id: 'post-1', authorId: 'user-1' };

    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === POLICIES_KEY) {
        return policies;
      }
      if (key === AUTHORIZE_RESOURCE_KEY) {
        return resources;
      }
      return undefined;
    });
    mockPoliciesService.assertCanAttemptRoutePoliciesForAuthUser.mockResolvedValue(
      undefined,
    );
    mockResourceAuthorizationService.authorizeResources.mockResolvedValue({
      Post: post,
    });

    await expect(
      guard.canActivate(createExecutionContext(request, handler)),
    ).resolves.toBe(true);

    expect(
      mockPoliciesService.assertCanAttemptRoutePoliciesForAuthUser,
    ).toHaveBeenCalledWith(request.user, policies);
    expect(
      mockResourceAuthorizationService.authorizeResources,
    ).toHaveBeenCalledWith({
      user: request.user,
      params: request.params,
      resources,
    });
    expect(
      mockPoliciesService.assertCanAttemptRoutePoliciesForAuthUser.mock
        .invocationCallOrder[0],
    ).toBeLessThan(
      mockResourceAuthorizationService.authorizeResources.mock
        .invocationCallOrder[0],
    );
    expect(
      (request as Record<string, unknown>)[AUTHORIZED_RESOURCES_REQUEST_KEY],
    ).toEqual({
      Post: post,
    });
  });

  it('bypasses authorization entirely for public routes', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) =>
      key === 'auth:public' ? true : [{ action: 'update', subject: 'Post' }],
    );

    await expect(
      guard.canActivate(createExecutionContext({}, () => true)),
    ).resolves.toBe(true);
    expect(
      mockPoliciesService.assertCanAttemptRoutePoliciesForAuthUser,
    ).not.toHaveBeenCalled();
    expect(
      mockResourceAuthorizationService.authorizeResources,
    ).not.toHaveBeenCalled();
  });

  it('does not run resource checks when the coarse route pass fails', async () => {
    mockReflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === POLICIES_KEY) {
        return [{ action: 'delete', subject: 'Post' }];
      }
      if (key === AUTHORIZE_RESOURCE_KEY) {
        return [{ action: 'delete', subject: 'Post', idParam: 'postId' }];
      }
      return undefined;
    });
    mockPoliciesService.assertCanAttemptRoutePoliciesForAuthUser.mockRejectedValue(
      new ForbiddenException(),
    );

    await expect(
      guard.canActivate(
        createExecutionContext(
          {
            user: { id: 'user-1' },
            params: { postId: 'post-1' },
          },
          () => true,
        ),
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(
      mockResourceAuthorizationService.authorizeResources,
    ).not.toHaveBeenCalled();
  });
});
