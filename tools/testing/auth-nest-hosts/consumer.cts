import {
  canonicalRequest,
  assertCanonicalCoverage,
} from './canonical-http.cjs';
import 'reflect-metadata';
import assert from 'node:assert/strict';
import {
  BadRequestException,
  Controller,
  Get,
  Req,
  Module,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  AuthModule,
  AuthPasskeyService,
  type AuthModuleOptions,
} from '@anarchitects/auth-nest';
import {
  AuthApplicationModule,
  AuthService,
} from '@anarchitects/auth-nest/application';
import {
  AuthPresentationModule,
  AuthorizedResource,
  provideAuthRuntimeGuards,
} from '@anarchitects/auth-nest/presentation';
import { AuthMailerModule } from '@anarchitects/auth-nest/infrastructure-mailer';
import {
  authConfig,
  type ResourceAuthorizationLoaderInput,
} from '@anarchitects/auth-nest/config';
import {
  AuthUserEntity,
  RoleEntity,
  PermissionEntity,
  PasskeyEntity,
  CreateAuthSchema1720200000000,
  AddBetterAuthAccountIssuer1788275931000,
  CreateBetterAuthPasskeysTable1760200001000,
  ExpandPasskeyCredentialStorage1790899200000,
} from '@anarchitects/auth-nest/infrastructure-persistence';
import {
  Public,
  Policies,
  AuthorizeResource,
  AUTH_PUBLIC_METADATA_KEY,
} from '@anarchitects/auth-declarations';
import type { AuthUser } from '@anarchitects/auth-ts/models';
import {
  MailerPort,
  NoopMailerAdapter,
} from '@anarchitects/common-nest-mailer';

export const identities = {
  Module,
  AuthModule,
  AuthService,
  AUTH_PUBLIC_METADATA_KEY,
};

@Controller('security')
class SecurityController {
  @Get('public')
  @Public()
  @Policies({ action: 'delete', subject: 'Post' })
  publicRoute() {
    return { public: true };
  }

  @Get('me')
  me(@Req() request: { user: AuthUser }) {
    return { id: request.user.id };
  }

  @Get('posts')
  @Policies({ action: 'read', subject: 'Post' })
  posts() {
    return { allowed: true };
  }

  @Get('admin')
  @Policies({ action: 'delete', subject: 'Post' })
  admin() {
    return { allowed: true };
  }

  @Get('posts/:postId')
  @AuthorizeResource({ action: 'read', subject: 'Post', idParam: 'postId' })
  resource(@AuthorizedResource() post: Record<string, unknown>) {
    return post;
  }
}

type PasskeyHarness = {
  app: NestFastifyApplication;
  AuthPasskeyService: typeof AuthPasskeyService;
  PasskeyEntity: typeof PasskeyEntity;
  userId: string;
  sessionCookie: string;
  restart: () => Promise<NestFastifyApplication>;
};

export async function runConsumer(
  validatePasskeys?: (harness: PasskeyHarness) => Promise<void>,
) {
  const secret = 'isolated-auth-consumer-jwt-secret-32';
  Object.assign(process.env, {
    AUTH_BETTER_AUTH_BASE_URL: 'http://localhost:3000/api/auth',
    AUTH_BETTER_AUTH_SECRET: 'isolated-auth-consumer-better-auth-secret-32',
    AUTH_PLUGIN_JWT_ENABLED: 'true',
    AUTH_PLUGIN_JWT_SECRET: secret,
    AUTH_PLUGIN_JWT_AUDIENCE: 'isolated',
    AUTH_PLUGIN_JWT_ISSUER: 'isolated',
    AUTH_PLUGIN_PASSKEYS_ENABLED: 'true',
    AUTH_PLUGIN_PASSKEY_RP_ID: 'localhost',
    AUTH_PLUGIN_PASSKEY_ORIGIN: 'http://localhost:3000',
    AUTH_MAILER_PROVIDER: 'node',
  });
  const options: AuthModuleOptions = {
    mailer: { provider: 'noop' },
    presentation: {
      application: {
        betterAuth: {
          baseUrl: 'http://localhost:3000/api/auth',
          secret: process.env['AUTH_BETTER_AUTH_SECRET'],
        },
        plugins: {
          jwt: {
            enabled: true,
            secret,
            audience: 'isolated',
            issuer: 'isolated',
          },
          passkeys: {
            enabled: true,
            rpID: 'localhost',
            origin: 'http://localhost:3000',
          },
        },
        resourceAuthorization: {
          loaders: {
            Post: ({ resourceId, user }: ResourceAuthorizationLoaderInput) =>
              resourceId === 'missing'
                ? null
                : {
                    id: resourceId,
                    authorId: resourceId === 'own' ? user.id : 'someone-else',
                  },
          },
        },
      },
    },
  };
  const createApp = async (
    mode: 'explicit' | 'config' | 'advanced' | 'disabled',
  ) => {
    const disabled = {
      ...options,
      presentation: {
        application: {
          ...options.presentation?.application,
          plugins: { jwt: { enabled: false }, passkeys: { enabled: false } },
        },
      },
    };
    const authImports =
      mode === 'advanced'
        ? [
            AuthPresentationModule.forRootFromConfig(options.presentation),
            AuthMailerModule.forRootFromConfig(options.mailer),
          ]
        : [
            mode === 'disabled'
              ? AuthModule.forRootFromConfig(disabled)
              : mode === 'config'
                ? AuthModule.forRootFromConfig(options)
                : AuthModule.forRoot(options),
          ];
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [authConfig],
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: process.env['AUTH_HOST_DATABASE_URL'],
          autoLoadEntities: true,
          synchronize: false,
          migrationsRun: true,
          migrations: [
            CreateAuthSchema1720200000000,
            CreateBetterAuthPasskeysTable1760200001000,
            AddBetterAuthAccountIssuer1788275931000,
            ExpandPasskeyCredentialStorage1790899200000,
          ],
        }),
        ...authImports,
      ],
      controllers: [SecurityController],
      providers: [...provideAuthRuntimeGuards()],
    }).compile();
    const app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({
        logger: false,
        schemaErrorFormatter: (errors, dataVar) =>
          new BadRequestException(
            `${dataVar} ${errors.map((error) => error.message).join(', ')}`,
          ),
      }),
    );
    app.useLogger(['error']);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    assert.ok(
      app.get(MailerPort) instanceof NoopMailerAdapter,
      'Explicit noop must override env node',
    );
    assert.ok(app.get(AuthService));
    assert.ok(app.get(AuthApplicationModule));
    return app;
  };
  let app = await createApp('explicit');
  try {
    const expectRequest = async (
      url: string,
      status: number,
      payload?: Record<string, unknown>,
      cookie?: string,
    ) => {
      const response = await canonicalRequest(app, {
        method: payload ? 'POST' : 'GET',
        url,
        payload,
        headers: cookie ? { cookie } : {},
        expectAbsent: status === 404,
      });
      assert.equal(response.statusCode, status, `${url}: ${response.body}`);
      return response;
    };
    await expectRequest('/security/public', 200);
    await expectRequest('/security/me', 401);
    await expectRequest('/auth/register', 400, { email: 'invalid' });
    await expectRequest('/auth/register', 200, {
      email: 'consumer@example.test',
      name: 'Consumer',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    const login = await expectRequest('/auth/login', 200, {
      credential: 'consumer@example.test',
      password: 'Password123!',
    });
    const cookies = login.headers['set-cookie'];
    const sessionCookie = (Array.isArray(cookies) ? cookies : [String(cookies)])
      .map((value) => value.split(';')[0])
      .join('; ');
    assert.match(sessionCookie, /better-auth\./);
    const userId = login.json().user.id as string;
    const source = app.get(DataSource);
    assert.deepEqual(
      await source.query('SELECT "issuer", "providerId" FROM auth.accounts'),
      [{ issuer: 'local:credential', providerId: 'credential' }],
    );
    const permission = await source.getRepository(PermissionEntity).save(
      new PermissionEntity({
        name: 'read-own-post',
        action: 'read',
        subject: 'Post',
        conditions: { authorId: userId },
      }),
    );
    const role = await source
      .getRepository(RoleEntity)
      .save(new RoleEntity({ name: 'writer', permissions: [permission] }));
    const user = await source
      .getRepository(AuthUserEntity)
      .findOneByOrFail({ id: userId });
    user.roles = [role];
    await source.getRepository(AuthUserEntity).save(user);
    await expectRequest('/security/me', 200, undefined, sessionCookie);
    await expectRequest('/security/posts', 200, undefined, sessionCookie);
    await expectRequest('/security/admin', 403, undefined, sessionCookie);
    assert.equal(
      (
        await expectRequest(
          '/security/posts/own',
          200,
          undefined,
          sessionCookie,
        )
      ).json().authorId,
      userId,
    );
    await expectRequest(
      '/security/posts/foreign',
      403,
      undefined,
      sessionCookie,
    );
    await expectRequest(
      '/security/posts/missing',
      404,
      undefined,
      sessionCookie,
    );
    const jwtLogin = await expectRequest('/auth/jwt/login', 200, {
      credential: 'consumer@example.test',
      password: 'Password123!',
    });
    const tokens = jwtLogin.json();
    const verified = await new JwtService({ secret }).verifyAsync(
      tokens.accessToken,
      { audience: 'isolated', issuer: 'isolated' },
    );
    assert.equal(verified.sub, userId);
    await expectRequest('/auth/jwt/refresh', 400, { refreshToken: 'invalid' });
    await expectRequest('/auth/jwt/refresh', 200, {
      refreshToken: tokens.refreshToken,
    });
    await expectRequest('/auth/jwt/logout', 200, tokens);
    assert.ok(
      (await source.query('SELECT * FROM auth.invalidated_tokens')).length > 0,
    );
    if (validatePasskeys) {
      await validatePasskeys({
        app,
        AuthPasskeyService,
        PasskeyEntity,
        userId,
        sessionCookie,
        restart: async () => {
          await app.close();
          app = await createApp('config');
          return app;
        },
      });
    }
    for (const mode of ['config', 'advanced'] as const) {
      await app.close();
      app = await createApp(mode);
      assert.equal(
        (await expectRequest('/auth/me', 200, undefined, sessionCookie)).json()
          .user.id,
        userId,
      );
      await expectRequest('/security/posts/own', 200, undefined, sessionCookie);
    }
    await expectRequest('/auth/logout', 200, {}, sessionCookie);
    await expectRequest('/security/me', 401, undefined, sessionCookie);
    // Exercise configured canonical bindings through each packed Nest host.
    // Only the application result is controlled; Fastify parsing remains real.
    for (const minimum of [10, 3]) {
      await app.close();
      options.contracts = { login: { password: { minLength: minimum } } };
      app = await createApp('explicit');
      const received: unknown[] = [];
      app.get(AuthService).login = async (dto) => {
        received.push(dto);
        return {
          body: { user: { id: 'profile-probe' }, rbac: [] },
          headers: new Headers(),
        };
      };
      const payload = {
        credential: 'consumer@example.test',
        password: minimum === 10 ? '12345678' : '1234',
      };
      await expectRequest('/auth/login', minimum === 10 ? 400 : 200, payload);
      assert.deepEqual(received, minimum === 10 ? [] : [payload]);
    }
    options.contracts = undefined;
    await app.close();
    app = await createApp('explicit');
    const probeLogin = await expectRequest('/auth/login', 200, {
      credential: 'consumer@example.test',
      password: 'Password123!',
    });
    const probeCookie = [probeLogin.headers['set-cookie']]
      .flat()
      .map((value) => String(value).split(';')[0])
      .join('; ');
    // Adapter-only transport probes for outcomes not reachable through the noop
    // recovery mailer. Real authentication, guards and the verifier/persistence
    // suite above remain separate evidence; these doubles prove no ceremony.
    const success = async () => ({ success: true });
    Object.assign(app.get(AuthService), {
      activateUser: success,
      changePassword: success,
      forgotPassword: success,
      resetPassword: success,
      verifyEmail: success,
      updateEmail: success,
    });
    const headers = new Headers();
    headers.append('set-cookie', 'fixture-a=1; Path=/; HttpOnly');
    headers.append('set-cookie', 'fixture-b=2; Path=/; HttpOnly');
    Object.assign(app.get(AuthPasskeyService), {
      beginRegistration: async () => ({
        headers,
        body: {
          challenge: 'YQ',
          rp: { name: 'Fixture' },
          user: { id: 'YQ', name: 'fixture', displayName: 'Fixture' },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        },
      }),
      finishRegistration: async () => ({ headers, body: { success: true } }),
      beginAuthentication: async () => ({ headers, body: { challenge: 'YQ' } }),
      finishAuthentication: async () => ({
        headers,
        body: { user: { id: userId }, rbac: [] },
      }),
    });
    const credential = {
      id: 'YQ',
      rawId: 'YQ',
      type: 'public-key',
      clientExtensionResults: {},
      response: {
        clientDataJSON: 'YQ',
        attestationObject: 'YQ',
        authenticatorData: 'YQ',
        signature: 'YQ',
      },
    };
    const probes: { method: string; url: string; payload: object }[] = [
      { method: 'PATCH', url: '/auth/activate', payload: { token: 'fixture' } },
      {
        method: 'PATCH',
        url: `/auth/change-password/${userId}`,
        payload: {
          currentPassword: 'Password123!',
          newPassword: 'Changed123!',
          confirmPassword: 'Changed123!',
        },
      },
      {
        method: 'POST',
        url: '/auth/forgot-password',
        payload: { email: 'consumer@example.test' },
      },
      {
        method: 'POST',
        url: '/auth/reset-password',
        payload: {
          token: 'fixture',
          password: 'Changed123!',
          confirmPassword: 'Changed123!',
        },
      },
      {
        method: 'POST',
        url: '/auth/verify-email',
        payload: { token: 'fixture' },
      },
      {
        method: 'PATCH',
        url: `/auth/update-email/${userId}`,
        payload: { newEmail: 'updated@example.test', password: 'Password123!' },
      },
      { method: 'POST', url: '/auth/passkeys/registration/begin', payload: {} },
      {
        method: 'POST',
        url: '/auth/passkeys/registration/finish',
        payload: { response: credential },
      },
      {
        method: 'POST',
        url: '/auth/passkeys/authentication/begin',
        payload: {},
      },
      {
        method: 'POST',
        url: '/auth/passkeys/authentication/finish',
        payload: { response: credential },
      },
    ];
    for (const probe of probes) {
      const response = await canonicalRequest(app, {
        ...probe,
        headers: { cookie: probeCookie },
        evidence: 'adapter-only',
      });
      assert.equal(response.statusCode, 200, `${probe.url}: ${response.body}`);
      if (probe.url.includes('/passkeys/'))
        assert.equal(response.headers['set-cookie']?.length, 2);
      const rejected = await canonicalRequest(app, {
        ...probe,
        payload: [],
        headers: { cookie: probeCookie },
        evidence: 'adapter-only',
      });
      assert.equal(rejected.statusCode, 400, `${probe.url}: ${rejected.body}`);
    }
    await app.close();
    app = await createApp('disabled');
    assert.throws(() => app.get(AuthPasskeyService));
    await expectRequest('/auth/jwt/login', 404, {
      credential: 'consumer@example.test',
      password: 'Password123!',
    });
    assertCanonicalCoverage(['auth']);
    console.log(
      'Auth host passed: facade/config/advanced DI, metadata, global guards, Fastify validation, sessions, CASL, JWT, PostgreSQL migrations/persistence and restart.',
    );
  } finally {
    await app.close();
  }
}
