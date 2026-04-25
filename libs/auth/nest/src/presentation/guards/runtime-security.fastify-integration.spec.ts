import {
  Controller,
  Get,
  Module,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import type { User } from '@anarchitects/auth-ts/models';
import {
  AuthorizeResource,
  Policies,
  Public,
} from '@anarchitects/auth-declarations';
import { AbilityFactory } from '../../application/factories/ability.factory';
import { AuthUserRepository } from '../../application/ports/auth-user.repository';
import { AUTH_RESOURCE_AUTHORIZATION_LOADERS } from '../../application/resource-authorization.tokens';
import { AuthEnginePort } from '../../application/services/auth-engine.port';
import { AuthPrincipalResolver } from '../../application/services/auth-principal.resolver';
import { PoliciesService } from '../../application/services/policies.service';
import { ResourceAuthorizationService } from '../../application/services/resource-authorization.service';
import { AuthorizedResource } from '../decorators/authorized-resource.decorator';
import { AuthenticationGuard } from './authentication.guard';
import { AuthorizationGuard } from './authorization.guard';
import { provideAuthRuntimeGuards } from '../runtime-security.providers';

const now = new Date('2026-04-25T10:00:00.000Z');

const writerUser: User = {
  id: 'user-1',
  email: 'writer@example.com',
  name: 'Writer',
  emailVerified: true,
  image: null,
  roles: [
    {
      id: 'role-writer',
      name: 'writer',
      description: null,
      permissions: [
        {
          id: 'perm-read-own-post',
          name: 'read-own-post',
          description: null,
          action: 'read',
          subject: 'Post',
          conditions: { authorId: 'user-1' },
          fields: null,
          inverted: false,
          reason: null,
          roles: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
      users: null,
      createdAt: now,
      updatedAt: now,
    },
  ],
  createdAt: now,
  updatedAt: now,
};

const limitedUser: User = {
  id: 'user-2',
  email: 'limited@example.com',
  name: 'Limited',
  emailVerified: true,
  image: null,
  roles: [
    {
      id: 'role-limited',
      name: 'limited',
      description: null,
      permissions: [
        {
          id: 'perm-read-comment',
          name: 'read-comment',
          description: null,
          action: 'read',
          subject: 'Comment',
          conditions: null,
          fields: null,
          inverted: false,
          reason: null,
          roles: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
      users: null,
      createdAt: now,
      updatedAt: now,
    },
  ],
  createdAt: now,
  updatedAt: now,
};

const usersById: Record<string, User> = {
  'user-1': writerUser,
  'user-2': limitedUser,
};

const postsById = {
  'post-1': { id: 'post-1', authorId: 'user-1', title: 'Owned post' },
  'post-2': { id: 'post-2', authorId: 'user-2', title: 'Other post' },
};

@Controller('security')
class RuntimeSecurityController {
  @Get('public')
  @Public()
  publicRoute() {
    return { route: 'public' };
  }

  @Get('public-policy')
  @Public()
  @Policies({ action: 'read', subject: 'Post' })
  publicPolicyRoute() {
    return { route: 'public-policy' };
  }

  @Get('me')
  authenticatedRoute(@Req() request: { user: User }) {
    return { userId: request.user.id };
  }

  @Get('posts')
  @Policies({ action: 'read', subject: 'Post' })
  policyRoute() {
    return { route: 'posts' };
  }

  @Get('admin')
  @Policies({ action: 'delete', subject: 'Post' })
  forbiddenPolicyRoute() {
    return { route: 'admin' };
  }

  @Get('posts/:postId')
  @Policies({ action: 'read', subject: 'Post' })
  @AuthorizeResource({ action: 'read', subject: 'Post', idParam: 'postId' })
  resourceRoute(
    @AuthorizedResource() post: (typeof postsById)[keyof typeof postsById],
  ) {
    return post;
  }
}

describe('runtime security app-shell activation', () => {
  let app: NestFastifyApplication | undefined;

  const postLoader = jest.fn(
    async ({ resourceId }: { resourceId: string }) =>
      postsById[resourceId as keyof typeof postsById] ?? null,
  );

  const mockAuthEnginePort: Pick<AuthEnginePort, 'getSession'> = {
    getSession: jest.fn(async (headers?: HeadersInit) => {
      const cookie = new Headers(headers).get('cookie');

      if (cookie?.includes('better-auth.session=user-1')) {
        return { userId: 'user-1' };
      }

      if (cookie?.includes('better-auth.session=user-2')) {
        return { userId: 'user-2' };
      }

      return null;
    }),
  };

  const mockAuthUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(async (conditions: { where?: { id?: string } }) => {
      const userId = conditions.where?.id;
      const user = userId ? usersById[userId] : null;

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    }),
    ensureRole: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  @Module({
    controllers: [RuntimeSecurityController],
    providers: [
      AbilityFactory,
      PoliciesService,
      AuthPrincipalResolver,
      ResourceAuthorizationService,
      AuthenticationGuard,
      AuthorizationGuard,
      {
        provide: AuthEnginePort,
        useValue: {
          register: jest.fn(),
          login: jest.fn(),
          logout: jest.fn(),
          requestPasswordReset: jest.fn(),
          resetPassword: jest.fn(),
          verifyEmail: jest.fn(),
          describeCapabilities: jest.fn(),
          passwordSignIn: jest.fn(),
          passkeySignIn: jest.fn(),
          socialSignIn: jest.fn(),
          ...mockAuthEnginePort,
        } satisfies Partial<AuthEnginePort>,
      },
      {
        provide: AuthUserRepository,
        useValue: mockAuthUserRepository,
      },
      {
        provide: AUTH_RESOURCE_AUTHORIZATION_LOADERS,
        useValue: {
          Post: postLoader,
        },
      },
      ...provideAuthRuntimeGuards(),
    ],
  })
  class RuntimeSecurityHostModule {}

  const createApp = async (): Promise<NestFastifyApplication> => {
    const moduleRef = await Test.createTestingModule({
      imports: [RuntimeSecurityHostModule],
    }).compile();

    const nextApp = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({ logger: false }),
    );
    nextApp.useLogger(false);
    await nextApp.init();
    await nextApp.getHttpAdapter().getInstance().ready();

    return nextApp;
  };

  afterEach(async () => {
    await app?.close();
    app = undefined;
    jest.clearAllMocks();
  });

  it('bypasses global guards for public routes', async () => {
    app = await createApp();

    const response = await app.inject({
      method: 'GET',
      url: '/security/public',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ route: 'public' });
    expect(postLoader).not.toHaveBeenCalled();
  });

  it('bypasses global authorization for public routes even when policy metadata exists', async () => {
    app = await createApp();

    const response = await app.inject({
      method: 'GET',
      url: '/security/public-policy',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ route: 'public-policy' });
  });

  it('requires authentication on non-public routes', async () => {
    app = await createApp();

    const response = await app.inject({
      method: 'GET',
      url: '/security/me',
    });

    expect(response.statusCode).toBe(401);
  });

  it('allows authenticated routes once the principal is resolved globally', async () => {
    app = await createApp();

    const response = await app.inject({
      method: 'GET',
      url: '/security/me',
      headers: {
        cookie: 'better-auth.session=user-1',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ userId: 'user-1' });
  });

  it('hydrates request.user before authorization runs', async () => {
    app = await createApp();

    const response = await app.inject({
      method: 'GET',
      url: '/security/posts',
      headers: {
        cookie: 'better-auth.session=user-1',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ route: 'posts' });
  });

  it('rejects policy-protected routes when the coarse route pass fails', async () => {
    app = await createApp();

    const response = await app.inject({
      method: 'GET',
      url: '/security/admin',
      headers: {
        cookie: 'better-auth.session=user-1',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('authorizes and returns the loaded resource when the concrete subject matches', async () => {
    app = await createApp();

    const response = await app.inject({
      method: 'GET',
      url: '/security/posts/post-1',
      headers: {
        cookie: 'better-auth.session=user-1',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(postsById['post-1']);
    expect(postLoader).toHaveBeenCalledWith({
      user: writerUser,
      resourceId: 'post-1',
    });
  });

  it('fails after loading the concrete resource when the CASL conditions do not match', async () => {
    app = await createApp();

    const response = await app.inject({
      method: 'GET',
      url: '/security/posts/post-2',
      headers: {
        cookie: 'better-auth.session=user-1',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(postLoader).toHaveBeenCalledWith({
      user: writerUser,
      resourceId: 'post-2',
    });
  });
});
