import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { User } from '@anarchitects/auth-ts/models';
import { Test, TestingModule } from '@nestjs/testing';
import { AbilityFactory } from '../factories/ability.factory';
import { AUTH_RESOURCE_AUTHORIZATION_LOADERS } from '../resource-authorization.tokens';
import { PoliciesService } from './policies.service';
import { ResourceAuthorizationService } from './resource-authorization.service';

describe('ResourceAuthorizationService', () => {
  let service: ResourceAuthorizationService;

  const mockPoliciesService = {
    buildAbilityForUser: jest.fn(),
  };

  const postLoader = jest.fn();
  const user = { id: 'user-1' } as User;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourceAuthorizationService,
        { provide: PoliciesService, useValue: mockPoliciesService },
        {
          provide: AUTH_RESOURCE_AUTHORIZATION_LOADERS,
          useValue: { Post: postLoader },
        },
      ],
    }).compile();

    service = module.get<ResourceAuthorizationService>(
      ResourceAuthorizationService,
    );
  });

  it('does nothing when no resource metadata exists', async () => {
    await expect(
      service.authorizeResources({
        user,
        resources: [],
      }),
    ).resolves.toEqual({});
    expect(mockPoliciesService.buildAbilityForUser).not.toHaveBeenCalled();
  });

  it('fails when the resource loader is not registered', async () => {
    mockPoliciesService.buildAbilityForUser.mockResolvedValue({
      can: jest.fn().mockReturnValue(true),
    });

    await expect(
      service.authorizeResources({
        user,
        params: { commentId: 'comment-1' },
        resources: [
          { action: 'update', subject: 'Comment', idParam: 'commentId' },
        ],
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('fails when the configured route parameter is missing', async () => {
    mockPoliciesService.buildAbilityForUser.mockResolvedValue({
      can: jest.fn().mockReturnValue(true),
    });

    await expect(
      service.authorizeResources({
        user,
        params: {},
        resources: [{ action: 'update', subject: 'Post', idParam: 'postId' }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('fails when the loader cannot find the resource', async () => {
    mockPoliciesService.buildAbilityForUser.mockResolvedValue({
      can: jest.fn().mockReturnValue(true),
    });
    postLoader.mockResolvedValue(null);

    await expect(
      service.authorizeResources({
        user,
        params: { postId: 'post-1' },
        resources: [{ action: 'update', subject: 'Post', idParam: 'postId' }],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('authorizes and returns a matching conditional resource', async () => {
    const abilityFactory = new AbilityFactory();
    const post = { id: 'post-1', authorId: 'user-1' };
    mockPoliciesService.buildAbilityForUser.mockResolvedValue(
      abilityFactory.buildAbility([
        {
          action: 'update',
          subject: 'Post',
          conditions: { authorId: 'user-1' },
        },
      ]),
    );
    postLoader.mockResolvedValue(post);

    await expect(
      service.authorizeResources({
        user,
        params: { postId: 'post-1' },
        resources: [{ action: 'update', subject: 'Post', idParam: 'postId' }],
      }),
    ).resolves.toEqual({
      Post: post,
    });
    expect(postLoader).toHaveBeenCalledWith({
      user,
      resourceId: 'post-1',
    });
  });

  it('forbids a non-matching conditional resource after loading it', async () => {
    const abilityFactory = new AbilityFactory();
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
      service.authorizeResources({
        user,
        params: { postId: 'post-1' },
        resources: [{ action: 'update', subject: 'Post', idParam: 'postId' }],
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
