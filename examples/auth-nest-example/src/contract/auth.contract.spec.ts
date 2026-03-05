import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import jestOpenAPI from 'jest-openapi';
import { AppModule } from '../app/app.module';
import { AUTH_EXAMPLE_SEEDS } from '../app/example-auth.constants';

describe('auth-nest-example contract', () => {
  let app: NestFastifyApplication;

  beforeAll(() => {
    const openApiPath = join(__dirname, '../../../../docs/openapi/openapi.json');
    const document = JSON.parse(readFileSync(openApiPath, 'utf8'));
    jestOpenAPI(document as never);
  });

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({ logger: false }),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /auth/register matches OpenAPI spec', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'new-user@example.com',
        password: 'newpass123',
        confirmPassword: 'newpass123',
        userName: 'new-user',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(apiExpect(response, 'POST', '/auth/register')).toSatisfyApiSpec();
  });

  it('PATCH /auth/activate matches OpenAPI spec', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/auth/activate',
      payload: {
        token: AUTH_EXAMPLE_SEEDS.pending.token,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(apiExpect(response, 'PATCH', '/auth/activate')).toSatisfyApiSpec();
  });

  it('POST /auth/login matches OpenAPI spec', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        credential: AUTH_EXAMPLE_SEEDS.admin.email,
        password: AUTH_EXAMPLE_SEEDS.admin.password,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(apiExpect(response, 'POST', '/auth/login')).toSatisfyApiSpec();
  });

  it('POST /auth/logout matches OpenAPI spec', async () => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        credential: AUTH_EXAMPLE_SEEDS.admin.email,
        password: AUTH_EXAMPLE_SEEDS.admin.password,
      },
    });

    const { accessToken, refreshToken } = JSON.parse(loginResponse.body) as {
      accessToken: string;
      refreshToken: string;
    };

    const response = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      payload: {
        accessToken,
        refreshToken,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(apiExpect(response, 'POST', '/auth/logout')).toSatisfyApiSpec();
  });

  it('PATCH /auth/change-password/{userId} matches OpenAPI spec', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/auth/change-password/${AUTH_EXAMPLE_SEEDS.admin.id}`,
      payload: {
        currentPassword: AUTH_EXAMPLE_SEEDS.admin.password,
        newPassword: 'updatedpass123',
        confirmPassword: 'updatedpass123',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(
      apiExpect(
        response,
        'PATCH',
        `/auth/change-password/${AUTH_EXAMPLE_SEEDS.admin.id}`,
      ),
    ).toSatisfyApiSpec();
  });

  it('POST /auth/forgot-password matches OpenAPI spec', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/forgot-password',
      payload: {
        email: AUTH_EXAMPLE_SEEDS.member.email,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(apiExpect(response, 'POST', '/auth/forgot-password')).toSatisfyApiSpec();
  });

  it('POST /auth/reset-password matches OpenAPI spec', async () => {
    await app.inject({
      method: 'POST',
      url: '/auth/forgot-password',
      payload: {
        email: AUTH_EXAMPLE_SEEDS.member.email,
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/reset-password',
      payload: {
        token: `reset-${AUTH_EXAMPLE_SEEDS.member.id}`,
        password: 'member-reset-123',
        confirmPassword: 'member-reset-123',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(apiExpect(response, 'POST', '/auth/reset-password')).toSatisfyApiSpec();
  });

  it('POST /auth/verify-email matches OpenAPI spec', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/verify-email',
      payload: {
        token: AUTH_EXAMPLE_SEEDS.verify.token,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(apiExpect(response, 'POST', '/auth/verify-email')).toSatisfyApiSpec();
  });

  it('PATCH /auth/update-email/{userId} matches OpenAPI spec', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/auth/update-email/${AUTH_EXAMPLE_SEEDS.admin.id}`,
      payload: {
        newEmail: 'admin+updated@example.com',
        password: AUTH_EXAMPLE_SEEDS.admin.password,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(
      apiExpect(response, 'PATCH', `/auth/update-email/${AUTH_EXAMPLE_SEEDS.admin.id}`),
    ).toSatisfyApiSpec();
  });

  it('POST /auth/refresh-tokens/{userId} matches OpenAPI spec', async () => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        credential: AUTH_EXAMPLE_SEEDS.admin.email,
        password: AUTH_EXAMPLE_SEEDS.admin.password,
      },
    });

    const { refreshToken } = JSON.parse(loginResponse.body) as {
      refreshToken: string;
    };

    const response = await app.inject({
      method: 'POST',
      url: `/auth/refresh-tokens/${AUTH_EXAMPLE_SEEDS.admin.id}`,
      payload: {
        refreshToken,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(
      apiExpect(
        response,
        'POST',
        `/auth/refresh-tokens/${AUTH_EXAMPLE_SEEDS.admin.id}`,
      ),
    ).toSatisfyApiSpec();
  });

  it('GET /auth/me matches OpenAPI spec', async () => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        credential: AUTH_EXAMPLE_SEEDS.admin.email,
        password: AUTH_EXAMPLE_SEEDS.admin.password,
      },
    });

    const { accessToken } = JSON.parse(loginResponse.body) as {
      accessToken: string;
    };

    const response = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(apiExpect(response, 'GET', '/auth/me')).toSatisfyApiSpec();
  });
});

function apiExpect(
  response: { statusCode: number; body: string; headers: unknown },
  method: string,
  path: string,
) {
  return {
    status: response.statusCode,
    body: JSON.parse(response.body),
    headers: response.headers,
    req: {
      method,
      path,
    },
  };
}
