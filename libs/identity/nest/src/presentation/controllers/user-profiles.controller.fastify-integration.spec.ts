import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import type {
  InjectOptions,
  Response as InjectResponse,
} from 'light-my-request';
import { UserProfilesController } from './user-profiles.controller';
import {
  CreateUserProfileService,
  GetUserProfileService,
  UpdateUserProfileService,
} from '../../application';

type MockCreateUserProfileService = {
  create: jest.Mock<Promise<Record<string, unknown>>, [unknown]>;
};

type MockGetUserProfileService = {
  getById: jest.Mock<Promise<Record<string, unknown>>, [string]>;
  getByAuthUserId: jest.Mock<Promise<Record<string, unknown>>, [string]>;
};

type MockUpdateUserProfileService = {
  updateById: jest.Mock<Promise<Record<string, unknown>>, [string, unknown]>;
};

type AppHarness = {
  app: NestFastifyApplication;
  createUserProfileService: MockCreateUserProfileService;
  getUserProfileService: MockGetUserProfileService;
  updateUserProfileService: MockUpdateUserProfileService;
};

const defaultProfile = {
  id: 'profile-1',
  authUserId: 'auth-user-1',
  displayName: 'Jane Doe',
  givenName: 'Jane',
  familyName: 'Doe',
  avatarUrl: null,
  locale: 'en-BE',
  timeZone: 'Europe/Brussels',
  createdAt: '2026-05-09T10:00:00.000Z',
  updatedAt: '2026-05-09T11:00:00.000Z',
};

const createMockCreateUserProfileService =
  (): MockCreateUserProfileService => ({
    create: jest.fn().mockResolvedValue(defaultProfile),
  });

const createMockGetUserProfileService = (): MockGetUserProfileService => ({
  getById: jest.fn().mockResolvedValue(defaultProfile),
  getByAuthUserId: jest.fn().mockResolvedValue(defaultProfile),
});

const createMockUpdateUserProfileService =
  (): MockUpdateUserProfileService => ({
    updateById: jest.fn().mockResolvedValue({
      ...defaultProfile,
      displayName: 'Jane Example',
      updatedAt: '2026-05-09T12:00:00.000Z',
    }),
  });

const createApp = async (): Promise<AppHarness> => {
  const createUserProfileService = createMockCreateUserProfileService();
  const getUserProfileService = createMockGetUserProfileService();
  const updateUserProfileService = createMockUpdateUserProfileService();

  const moduleRef = await Test.createTestingModule({
    controllers: [UserProfilesController],
    providers: [
      {
        provide: CreateUserProfileService,
        useValue: createUserProfileService,
      },
      {
        provide: GetUserProfileService,
        useValue: getUserProfileService,
      },
      {
        provide: UpdateUserProfileService,
        useValue: updateUserProfileService,
      },
    ],
  }).compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({ logger: false }),
  );

  app.useLogger(false);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return {
    app,
    createUserProfileService,
    getUserProfileService,
    updateUserProfileService,
  };
};

const parseJson = (response: InjectResponse): Record<string, unknown> =>
  JSON.parse(response.body) as Record<string, unknown>;

const expectValidationFailure = (
  response: InjectResponse,
  location: 'body' | 'params',
): void => {
  expect(response.statusCode).toBe(400);

  const body = parseJson(response);

  expect(body).toEqual(
    expect.objectContaining({
      statusCode: 400,
      message: expect.any(String),
    }),
  );
  expect(body['message']).toEqual(expect.stringContaining(location));
};

const injectJson = (
  app: NestFastifyApplication,
  options: InjectOptions,
): Promise<InjectResponse> =>
  app.inject({
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

describe('UserProfilesController Fastify integration', () => {
  let app: NestFastifyApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('accepts a valid create profile request', async () => {
    const harness = await createApp();
    app = harness.app;

    const payload = {
      authUserId: 'auth-user-1',
      displayName: 'Jane Doe',
    };

    const response = await injectJson(app, {
      method: 'POST',
      url: '/identity/profiles',
      payload,
    });

    expect(response.statusCode).toBe(200);
    expect(parseJson(response)).toEqual(defaultProfile);
    expect(harness.createUserProfileService.create).toHaveBeenCalledWith(
      payload,
    );
  });

  it('returns 400 for duplicate profiles on the same auth user', async () => {
    const harness = await createApp();
    app = harness.app;
    harness.createUserProfileService.create.mockRejectedValueOnce(
      new BadRequestException(
        'User profile already exists for auth user #auth-user-1',
      ),
    );

    const response = await injectJson(app, {
      method: 'POST',
      url: '/identity/profiles',
      payload: {
        authUserId: 'auth-user-1',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(parseJson(response)).toEqual(
      expect.objectContaining({
        statusCode: 400,
        message: 'User profile already exists for auth user #auth-user-1',
      }),
    );
  });

  it('gets a profile by profile id', async () => {
    const harness = await createApp();
    app = harness.app;

    const response = await app.inject({
      method: 'GET',
      url: '/identity/profiles/profile-1',
    });

    expect(response.statusCode).toBe(200);
    expect(parseJson(response)).toEqual(defaultProfile);
    expect(harness.getUserProfileService.getById).toHaveBeenCalledWith(
      'profile-1',
    );
  });

  it('gets a profile by auth user id', async () => {
    const harness = await createApp();
    app = harness.app;

    const response = await app.inject({
      method: 'GET',
      url: '/identity/profiles/by-auth-user/auth-user-1',
    });

    expect(response.statusCode).toBe(200);
    expect(parseJson(response)).toEqual(defaultProfile);
    expect(harness.getUserProfileService.getByAuthUserId).toHaveBeenCalledWith(
      'auth-user-1',
    );
  });

  it('updates editable profile fields', async () => {
    const harness = await createApp();
    app = harness.app;

    const payload = {
      displayName: 'Jane Example',
    };

    const response = await injectJson(app, {
      method: 'PATCH',
      url: '/identity/profiles/profile-1',
      payload,
    });

    expect(response.statusCode).toBe(200);
    expect(parseJson(response)).toEqual({
      ...defaultProfile,
      displayName: 'Jane Example',
      updatedAt: '2026-05-09T12:00:00.000Z',
    });
    expect(harness.updateUserProfileService.updateById).toHaveBeenCalledWith(
      'profile-1',
      payload,
    );
  });

  it('rejects malformed create bodies', async () => {
    const harness = await createApp();
    app = harness.app;

    const response = await injectJson(app, {
      method: 'POST',
      url: '/identity/profiles',
      payload: {
        displayName: 'Jane Doe',
      },
    });

    expectValidationFailure(response, 'body');
    expect(harness.createUserProfileService.create).not.toHaveBeenCalled();
  });

  it('rejects malformed patch bodies', async () => {
    const harness = await createApp();
    app = harness.app;

    const response = await injectJson(app, {
      method: 'PATCH',
      url: '/identity/profiles/profile-1',
      payload: {
        displayName: { value: 'Jane Example' },
      },
    });

    expectValidationFailure(response, 'body');
    expect(harness.updateUserProfileService.updateById).not.toHaveBeenCalled();
  });

  it('rejects malformed auth user id params', async () => {
    const harness = await createApp();
    app = harness.app;

    const response = await app.inject({
      method: 'GET',
      url: '/identity/profiles/by-auth-user/%20',
    });

    expectValidationFailure(response, 'params');
    expect(
      harness.getUserProfileService.getByAuthUserId,
    ).not.toHaveBeenCalled();
  });

  it('returns 404 when a profile id is unknown', async () => {
    const harness = await createApp();
    app = harness.app;
    harness.getUserProfileService.getById.mockRejectedValueOnce(
      new NotFoundException('User profile with id #missing-profile not found'),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/identity/profiles/missing-profile',
    });

    expect(response.statusCode).toBe(404);
    expect(parseJson(response)).toEqual(
      expect.objectContaining({
        statusCode: 404,
        message: 'User profile with id #missing-profile not found',
      }),
    );
  });

  it('returns 404 when updating a missing profile', async () => {
    const harness = await createApp();
    app = harness.app;
    harness.updateUserProfileService.updateById.mockRejectedValueOnce(
      new NotFoundException('User profile with id #missing-profile not found'),
    );

    const response = await injectJson(app, {
      method: 'PATCH',
      url: '/identity/profiles/missing-profile',
      payload: {
        displayName: 'Updated',
      },
    });

    expect(response.statusCode).toBe(404);
    expect(parseJson(response)).toEqual(
      expect.objectContaining({
        statusCode: 404,
        message: 'User profile with id #missing-profile not found',
      }),
    );
  });
});
