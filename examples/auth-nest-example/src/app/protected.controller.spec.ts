import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { AUTH_EXAMPLE_SEEDS } from './example-auth.constants';

describe('ProtectedController', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({ logger: false }),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 for anonymous access', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/protected/admin',
    });

    expect(response.statusCode).toBe(401);
  });

  it('returns 403 for authenticated user without required policy', async () => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        credential: AUTH_EXAMPLE_SEEDS.member.email,
        password: AUTH_EXAMPLE_SEEDS.member.password,
      },
    });
    expect(loginResponse.statusCode).toBe(200);

    const { accessToken } = JSON.parse(loginResponse.body) as {
      accessToken: string;
    };

    const response = await app.inject({
      method: 'GET',
      url: '/protected/admin',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('returns 200 for authenticated user with required policy', async () => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        credential: AUTH_EXAMPLE_SEEDS.admin.email,
        password: AUTH_EXAMPLE_SEEDS.admin.password,
      },
    });
    expect(loginResponse.statusCode).toBe(200);

    const { accessToken } = JSON.parse(loginResponse.body) as {
      accessToken: string;
    };

    const response = await app.inject({
      method: 'GET',
      url: '/protected/admin',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      area: 'admin',
      status: 'granted',
      userId: AUTH_EXAMPLE_SEEDS.admin.id,
    });
  });
});
