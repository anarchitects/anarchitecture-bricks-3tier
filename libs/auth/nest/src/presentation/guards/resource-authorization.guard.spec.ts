import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { AbilityFactory } from '../../application/factories/ability.factory';
import { PoliciesService } from '../../application/services/policies.service';
import { AUTH_RESOURCE_AUTHORIZATION_LOADERS } from '../../application/resource-authorization.tokens';
import { ResourceAuthorizationGuard } from './resource-authorization.guard';
import { AUTHORIZED_RESOURCES_REQUEST_KEY } from '../authorized-resource.request';

describe('ResourceAuthorizationGuard', () => {
  let guard: ResourceAuthorizationGuard;

  const mockPoliciesService = {
    buildAbilityForUser: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    getAllAndMerge: jest.fn(),
  };

  const postLoader = jest.fn();
  const loaders = {
    Post: postLoader,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourceAuthorizationGuard,
        AbilityFactory,
        { provide: PoliciesService, useValue: mockPoliciesService },
        { provide: Reflector, useValue: mockReflector },
        {
          provide: AUTH_RESOURCE_AUTHORIZATION_LOADERS,
          useValue: loaders,
        },
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
    expect(mockPoliciesService.buildAbilityForUser).not.toHaveBeenCalled();
  });

  it('throws when the user is missing for resource-authorized routes', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([
      { action: 'update', subject: 'Post', idParam: 'postId' },
    ]);

    await expect(guard.canActivate(createExecutionContext({}))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws when the resource loader is not registered', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([
      { action: 'update', subject: 'Comment', idParam: 'commentId' },
    ]);
    mockPoliciesService.buildAbilityForUser.mockResolvedValue({
      can: jest.fn().mockReturnValue(true),
    });

    await expect(
      guard.canActivate(
        createExecutionContext({
          user: { id: 'user-1' },
          params: { commentId: 'comment-1' },
        }),
      ),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('throws when the configured route parameter is missing', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([
      { action: 'update', subject: 'Post', idParam: 'postId' },
    ]);
    mockPoliciesService.buildAbilityForUser.mockResolvedValue({
      can: jest.fn().mockReturnValue(true),
    });

    await expect(
      guard.canActivate(
        createExecutionContext({
          user: { id: 'user-1' },
          params: {},
        }),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when the loader cannot find the resource', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([
      { action: 'update', subject: 'Post', idParam: 'postId' },
    ]);
    mockPoliciesService.buildAbilityForUser.mockResolvedValue({
      can: jest.fn().mockReturnValue(true),
    });
    postLoader.mockResolvedValue(null);

    await expect(
      guard.canActivate(
        createExecutionContext({
          user: { id: 'user-1' },
          params: { postId: 'post-1' },
        }),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('loads, authorizes, and attaches a matching conditional resource', async () => {
    const abilityFactory = new AbilityFactory();
    const request = {
      user: { id: 'user-1' },
      params: { postId: 'post-1' },
    };

    mockReflector.getAllAndOverride.mockReturnValue([
      { action: 'update', subject: 'Post', idParam: 'postId' },
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
      guard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);
    expect(
      (request as Record<string, unknown>)[AUTHORIZED_RESOURCES_REQUEST_KEY],
    ).toEqual({
      Post: { id: 'post-1', authorId: 'user-1' },
    });
  });

  it('forbids a non-matching conditional resource after loading it', async () => {
    const abilityFactory = new AbilityFactory();

    mockReflector.getAllAndOverride.mockReturnValue([
      { action: 'update', subject: 'Post', idParam: 'postId' },
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
    postLoader.mockResolvedValue({ id: 'post-1', authorId: 'user-2' });

    await expect(
      guard.canActivate(
        createExecutionContext({
          user: { id: 'user-1' },
          params: { postId: 'post-1' },
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows a matching field-scoped rule at the instance level and attaches the resource', async () => {
    const abilityFactory = new AbilityFactory();
    const request = {
      user: { id: 'user-1' },
      params: { postId: 'post-1' },
    };

    mockReflector.getAllAndOverride.mockReturnValue([
      { action: 'read', subject: 'Post', idParam: 'postId' },
    ]);
    mockPoliciesService.buildAbilityForUser.mockResolvedValue(
      abilityFactory.buildAbility([
        {
          action: 'read',
          subject: 'Post',
          fields: ['title'],
        },
      ]),
    );
    postLoader.mockResolvedValue({ id: 'post-1', title: 'Hello' });

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);
    expect(
      (request as Record<string, unknown>)[AUTHORIZED_RESOURCES_REQUEST_KEY],
    ).toEqual({
      Post: { id: 'post-1', title: 'Hello' },
    });
  });

  it('forbids unconditional inverted rules on a loaded resource', async () => {
    const abilityFactory = new AbilityFactory();

    mockReflector.getAllAndOverride.mockReturnValue([
      { action: 'delete', subject: 'Post', idParam: 'postId' },
    ]);
    mockPoliciesService.buildAbilityForUser.mockResolvedValue(
      abilityFactory.buildAbility([
        {
          action: 'delete',
          subject: 'Post',
          inverted: true,
        },
      ]),
    );
    postLoader.mockResolvedValue({ id: 'post-1' });

    await expect(
      guard.canActivate(
        createExecutionContext({
          user: { id: 'user-1' },
          params: { postId: 'post-1' },
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('fails when ability construction rejects malformed persisted rules', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([
      { action: 'read', subject: 'Post', idParam: 'postId' },
    ]);
    mockPoliciesService.buildAbilityForUser.mockRejectedValue(
      new Error('Malformed persisted policy rule payload'),
    );

    await expect(
      guard.canActivate(
        createExecutionContext({
          user: { id: 'user-1' },
          params: { postId: 'post-1' },
        }),
      ),
    ).rejects.toThrow('Malformed persisted policy rule payload');
  });
});
