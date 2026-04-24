import {
  ExecutionContext,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ResourceAuthorizationService } from '../../application/services/resource-authorization.service';
import { ResourceAuthorizationGuard } from './resource-authorization.guard';
import { AUTHORIZED_RESOURCES_REQUEST_KEY } from '../authorized-resource.request';

describe('ResourceAuthorizationGuard', () => {
  let guard: ResourceAuthorizationGuard;

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
        ResourceAuthorizationGuard,
        {
          provide: ResourceAuthorizationService,
          useValue: mockResourceAuthorizationService,
        },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<ResourceAuthorizationGuard>(ResourceAuthorizationGuard);
  });

  const createExecutionContext = (
    request: Record<string, unknown>,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => 'handler',
      getClass: () => 'class',
    }) as unknown as ExecutionContext;

  it('allows requests without resource authorization metadata', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(guard.canActivate(createExecutionContext({}))).resolves.toBe(
      true,
    );
    expect(
      mockResourceAuthorizationService.authorizeResources,
    ).not.toHaveBeenCalled();
  });

  it('throws when the user is missing for resource-authorized routes', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([
      { action: 'update', subject: 'Post', idParam: 'postId' },
    ]);

    await expect(guard.canActivate(createExecutionContext({}))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('delegates full resource authorization and attaches loaded resources', async () => {
    const request = {
      user: { id: 'user-1' },
      params: { postId: 'post-1' },
    };
    const resources = [
      { action: 'update', subject: 'Post', idParam: 'postId' },
    ];
    const post = { id: 'post-1', authorId: 'user-1' };
    mockReflector.getAllAndOverride.mockReturnValue(resources);
    mockResourceAuthorizationService.authorizeResources.mockResolvedValue({
      Post: post,
    });

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);
    expect(
      mockResourceAuthorizationService.authorizeResources,
    ).toHaveBeenCalledWith({
      user: request.user,
      params: request.params,
      resources,
    });
    expect(
      (request as Record<string, unknown>)[AUTHORIZED_RESOURCES_REQUEST_KEY],
    ).toEqual({
      Post: post,
    });
  });

  it('bubbles resource authorization failures', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([
      { action: 'update', subject: 'Post', idParam: 'postId' },
    ]);
    mockResourceAuthorizationService.authorizeResources.mockRejectedValue(
      new InternalServerErrorException(),
    );

    await expect(
      guard.canActivate(
        createExecutionContext({
          user: { id: 'user-1' },
          params: { postId: 'post-1' },
        }),
      ),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
