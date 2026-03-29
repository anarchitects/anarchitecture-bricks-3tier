import { ConfigModule } from '@nestjs/config';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  GenericContainer,
  StartedTestContainer,
  Wait,
} from 'testcontainers';
import { AuthModule } from '../auth.module';
import { loadBetterAuthTypeormAdapterModule } from '../infrastructure-engine/better-auth/better-auth.module-loader';
import { CreateAuthSchema1720200000000 } from '../infrastructure-persistence/migrations/1720200000000-create-auth-schema';

describe('published Better Auth TypeORM adapter integration', () => {
  let container: StartedTestContainer;
  let app: NestFastifyApplication;

  afterAll(async () => {
    if (app) {
      await app.close();
    }

    if (container) {
      await container.stop();
    }
  });

  it('loads the published adapter module from the installed package', async () => {
    const adapterModule = await loadBetterAuthTypeormAdapterModule();

    expect(adapterModule).toEqual(
      expect.objectContaining({
        createBetterAuthTypeormAdapter: expect.any(Function),
      }),
    );
  });

  it('boots auth-nest with the published adapter path and completes the core session flow', async () => {
    container = await new GenericContainer('postgres:16-alpine')
      .withEnvironment({
        POSTGRES_DB: 'anarchitecture_auth',
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'postgres',
      })
      .withExposedPorts(5432)
      .withWaitStrategy(
        Wait.forLogMessage('database system is ready to accept connections'),
      )
      .start();

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: container.getHost(),
          port: container.getMappedPort(5432),
          username: 'postgres',
          password: 'postgres',
          database: 'anarchitecture_auth',
          autoLoadEntities: true,
          synchronize: false,
          migrationsRun: true,
          migrations: [CreateAuthSchema1720200000000],
        }),
        AuthModule.forRoot({
          presentation: {
            application: {
              betterAuth: {
                baseUrl: 'http://localhost:3000/api/auth',
                secret: 'integration-test-better-auth-secret-32',
                callbackUrls: {
                  verifyEmail: 'http://localhost:3000/verify-email',
                  resetPassword: 'http://localhost:3000/reset-password',
                },
              },
              encryption: {
                algorithm: 'bcrypt',
                key: 'integration-test-encryption-key',
              },
            },
          },
          mailer: {
            provider: 'noop',
          },
        }),
      ],
    }).compile();

    app =
      moduleRef.createNestApplication<NestFastifyApplication>(
        new FastifyAdapter({ logger: false }),
      );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'integration@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        name: 'Integration User',
      },
    });

    expect(registerResponse.statusCode).toBe(200);
    expect(registerResponse.json()).toEqual({ success: true });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        credential: 'integration@example.com',
        password: 'Password123!',
      },
    });

    expect(loginResponse.statusCode).toBe(200);

    const sessionCookie = extractSessionCookie(loginResponse.headers['set-cookie']);
    expect(sessionCookie).toContain('better-auth.');

    const loginBody = loginResponse.json();
    expect(loginBody).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          email: 'integration@example.com',
          name: 'Integration User',
        }),
        rbac: expect.any(Array),
      }),
    );

    const meResponse = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: {
        cookie: sessionCookie,
      },
    });

    expect(meResponse.statusCode).toBe(200);
    expect(meResponse.json()).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          id: loginBody.user.id,
          email: 'integration@example.com',
        }),
        rbac: expect.any(Array),
      }),
    );

    const logoutResponse = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: {
        cookie: sessionCookie,
      },
      payload: {},
    });

    expect(logoutResponse.statusCode).toBe(200);
    expect(logoutResponse.json()).toEqual({ success: true });

    const clearedCookie = extractSessionCookie(
      logoutResponse.headers['set-cookie'],
    );
    expect(clearedCookie).toContain('better-auth.');

    const meAfterLogoutResponse = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: {
        cookie: clearedCookie,
      },
    });

    expect(meAfterLogoutResponse.statusCode).toBe(400);
    expect(meAfterLogoutResponse.json()).toEqual(
      expect.objectContaining({
        message: 'No active auth session',
      }),
    );
  });
});

function extractSessionCookie(
  headerValue: string | string[] | undefined,
): string {
  const cookies = Array.isArray(headerValue)
    ? headerValue
    : headerValue
      ? [headerValue]
      : [];

  const sessionCookie = cookies.find((cookie) =>
    /^better-auth\.[^=]+=/.test(cookie),
  );
  if (!sessionCookie) {
    throw new Error('Missing Better Auth session cookie in response headers.');
  }

  const [cookieValue] = sessionCookie.split(';');
  if (!cookieValue) {
    throw new Error('Malformed Better Auth session cookie in response headers.');
  }

  return cookieValue;
}
