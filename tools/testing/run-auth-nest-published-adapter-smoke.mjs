import assert from 'node:assert/strict';
import { mkdir, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import Module, { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { ConfigModule } from '@nestjs/config';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from 'pg';
import { GenericContainer, Wait } from 'testcontainers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..', '..');
const require = createRequire(import.meta.url);

const nodeModulesRoot = path.join(
  workspaceRoot,
  '.tmp',
  'auth-nest-published-adapter',
  'node_modules',
  '@anarchitects',
);

async function main() {
  await prepareWorkspacePackageLinks();

  const { AuthModule } = require(path.join(
    workspaceRoot,
    'dist',
    'libs',
    'auth',
    'nest',
    'src',
    'auth.module.js',
  ));
  const { loadBetterAuthTypeormAdapterModule } = require(path.join(
    workspaceRoot,
    'dist',
    'libs',
    'auth',
    'nest',
    'src',
    'infrastructure-engine',
    'better-auth',
    'better-auth.module-loader.js',
  ));
  const { CreateAuthSchema1720200000000 } = require(path.join(
    workspaceRoot,
    'dist',
    'libs',
    'auth',
    'nest',
    'src',
    'infrastructure-persistence',
    'migrations',
    '1720200000000-create-auth-schema.js',
  ));

  const adapterModule = await loadBetterAuthTypeormAdapterModule();
  assert.equal(
    typeof adapterModule.createBetterAuthTypeormAdapter,
    'function',
    'Expected the published package to export createBetterAuthTypeormAdapter.',
  );

  let container;
  let app;

  try {
    container = await new GenericContainer('postgres:16-alpine')
      .withEnvironment({
        POSTGRES_DB: 'anarchitecture_auth',
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'postgres',
      })
      .withExposedPorts(5432)
      .withWaitStrategy(Wait.forListeningPorts())
      .start();

    const host = container.getHost();
    const port = container.getMappedPort(5432);
    await waitForPostgres(
      host,
      port,
      'postgres',
      'postgres',
      'anarchitecture_auth',
    );

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host,
          port,
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

    app = moduleRef.createNestApplication(new FastifyAdapter({ logger: false }));
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
    assertStatus(registerResponse.statusCode, 200, 'register', registerResponse.body);
    assert.deepEqual(registerResponse.json(), { success: true });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        credential: 'integration@example.com',
        password: 'Password123!',
      },
    });
    assertStatus(loginResponse.statusCode, 200, 'login', loginResponse.body);

    const sessionCookie = extractSessionCookie(loginResponse.headers['set-cookie']);
    assert.match(sessionCookie, /^better-auth\./);

    const loginBody = loginResponse.json();
    assert.equal(loginBody.user.email, 'integration@example.com');
    assert.equal(loginBody.user.name, 'Integration User');
    assert.ok(Array.isArray(loginBody.rbac));

    const meResponse = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: {
        cookie: sessionCookie,
      },
    });
    assertStatus(meResponse.statusCode, 200, 'me', meResponse.body);

    const meBody = meResponse.json();
    assert.equal(meBody.user.id, loginBody.user.id);
    assert.equal(meBody.user.email, 'integration@example.com');
    assert.ok(Array.isArray(meBody.rbac));

    const logoutResponse = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: {
        cookie: sessionCookie,
      },
      payload: {},
    });
    assertStatus(logoutResponse.statusCode, 200, 'logout', logoutResponse.body);
    assert.deepEqual(logoutResponse.json(), { success: true });

    const clearedCookie = extractSessionCookie(logoutResponse.headers['set-cookie']);

    const meAfterLogoutResponse = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: {
        cookie: clearedCookie,
      },
    });
    assertStatus(
      meAfterLogoutResponse.statusCode,
      400,
      'me after logout',
      meAfterLogoutResponse.body,
    );
    assert.equal(meAfterLogoutResponse.json().message, 'No active auth session');
  } finally {
    if (app) {
      await app.close();
    }

    if (container) {
      await container.stop();
    }
  }
}

async function prepareWorkspacePackageLinks() {
  await rm(path.join(workspaceRoot, '.tmp', 'auth-nest-published-adapter'), {
    recursive: true,
    force: true,
  });
  await mkdir(nodeModulesRoot, { recursive: true });

  const links = [
    {
      name: 'auth-ts',
      target: path.join(workspaceRoot, 'dist', 'libs', 'auth', 'ts'),
    },
    {
      name: 'common-nest-mailer',
      target: path.join(workspaceRoot, 'dist', 'libs', 'common', 'nest', 'mailer'),
    },
  ];

  for (const link of links) {
    await symlink(link.target, path.join(nodeModulesRoot, link.name), 'junction');
  }

  process.env.NODE_PATH = process.env.NODE_PATH
    ? `${path.join(workspaceRoot, '.tmp', 'auth-nest-published-adapter', 'node_modules')}${path.delimiter}${process.env.NODE_PATH}`
    : path.join(workspaceRoot, '.tmp', 'auth-nest-published-adapter', 'node_modules');

  Module._initPaths();
}

async function waitForPostgres(host, port, username, password, database) {
  let lastError;

  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const client = new Client({
      host,
      port,
      user: username,
      password,
      database,
    });

    try {
      await client.connect();
      await client.query('select 1');
      await client.end();
      return;
    } catch (error) {
      lastError = error;

      try {
        await client.end();
      } catch {
        // Best-effort cleanup after failed connection attempts.
      }

      await delay(1_000);
    }
  }

  throw new Error(
    `PostgreSQL container did not become ready in time: ${String(lastError)}`,
  );
}

function assertStatus(actual, expected, operation, body) {
  assert.equal(
    actual,
    expected,
    `Expected ${operation} to return ${expected}, received ${actual}. Body: ${body}`,
  );
}

function extractSessionCookie(headerValue) {
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

main().catch((error) => {
  console.error('Published Better Auth adapter integration failed.');
  console.error(error);
  process.exit(1);
});
