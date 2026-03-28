import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import {
  CommonMailerModule,
  MailerPort,
  NoopMailerAdapter,
} from '@anarchitects/common-nest-mailer';
import { NodeMailerAdapter } from './infrastructure-mailer/adapters/node-mailer.adapter';
import {
  AUTH_RESOURCE_AUTHORIZATION_LOADERS,
  AuthService,
} from './application';
import { AuthModule } from './auth.module';
import { AuthController } from './presentation';

const repositoryStub = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  preload: jest.fn(),
  remove: jest.fn(),
};

const dataSourceStub = {
  entityMetadatas: [],
  options: { type: 'postgres' },
  getRepository: jest.fn().mockReturnValue(repositoryStub),
  getTreeRepository: jest.fn().mockReturnValue(repositoryStub),
  getMongoRepository: jest.fn().mockReturnValue(repositoryStub),
};

const ORIGINAL_AUTH_ENV = {
  mailerProvider: process.env['AUTH_MAILER_PROVIDER'],
};

@Global()
@Module({
  providers: [{ provide: getDataSourceToken(), useValue: dataSourceStub }],
  exports: [getDataSourceToken()],
})
class TypeOrmTestingModule {}

const authModuleOptions = {
  presentation: {
    application: {
      encryption: {
        algorithm: 'bcrypt' as const,
        key: 'test-key',
      },
    },
  },
};

describe('AuthModule', () => {
  afterEach(() => {
    if (ORIGINAL_AUTH_ENV.mailerProvider === undefined) {
      delete process.env['AUTH_MAILER_PROVIDER'];
    } else {
      process.env['AUTH_MAILER_PROVIDER'] = ORIGINAL_AUTH_ENV.mailerProvider;
    }
  });

  it('compiles and resolves auth tokens when mailer is enabled via forRoot', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmTestingModule,
        CommonMailerModule.forRootAsync({
          useFactory: () => ({
            transport: { jsonTransport: true },
            defaults: { from: 'noreply@example.com' },
            template: { dir: 'templates' },
          }),
        }),
        AuthModule.forRoot({
          ...authModuleOptions,
          mailer: {
            provider: 'node',
          },
        }),
      ],
    }).compile();

    expect(moduleRef.get(AuthController, { strict: false })).toBeDefined();
    expect(moduleRef.get(AuthService, { strict: false })).toBeDefined();
    expect(moduleRef.get(MailerPort, { strict: false })).toBeInstanceOf(
      NodeMailerAdapter,
    );
  });

  it('compiles and resolves auth tokens when mailer is disabled via forRoot', async () => {
    const postLoader = jest.fn();
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmTestingModule,
        AuthModule.forRoot({
          ...authModuleOptions,
          presentation: {
            ...authModuleOptions.presentation,
            application: {
              ...authModuleOptions.presentation.application,
              resourceAuthorization: {
                loaders: {
                  Post: postLoader,
                },
              },
            },
          },
          mailer: {
            provider: 'noop',
          },
        }),
      ],
    }).compile();

    expect(moduleRef.get(AuthController, { strict: false })).toBeDefined();
    expect(moduleRef.get(AuthService, { strict: false })).toBeDefined();
    expect(moduleRef.get(MailerPort, { strict: false })).toBeInstanceOf(
      NoopMailerAdapter,
    );
    expect(
      moduleRef.get(AUTH_RESOURCE_AUTHORIZATION_LOADERS, { strict: false }),
    ).toEqual({
      Post: postLoader,
    });
  });

  it('keeps forRoot explicit and ignores AUTH_MAILER_PROVIDER', async () => {
    process.env['AUTH_MAILER_PROVIDER'] = 'noop';

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmTestingModule,
        CommonMailerModule.forRootAsync({
          useFactory: () => ({
            transport: { jsonTransport: true },
            defaults: { from: 'noreply@example.com' },
            template: { dir: 'templates' },
          }),
        }),
        AuthModule.forRoot(authModuleOptions),
      ],
    }).compile();

    expect(moduleRef.get(MailerPort, { strict: false })).toBeInstanceOf(
      NodeMailerAdapter,
    );
  });

  it('resolves AUTH_MAILER_PROVIDER through forRootFromConfig', async () => {
    process.env['AUTH_MAILER_PROVIDER'] = 'noop';

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmTestingModule,
        AuthModule.forRootFromConfig({
          presentation: authModuleOptions.presentation,
        }),
      ],
    }).compile();

    expect(moduleRef.get(MailerPort, { strict: false })).toBeInstanceOf(
      NoopMailerAdapter,
    );
  });

  it('lets forRootFromConfig overrides win over AUTH_MAILER_PROVIDER', async () => {
    process.env['AUTH_MAILER_PROVIDER'] = 'noop';

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmTestingModule,
        CommonMailerModule.forRootAsync({
          useFactory: () => ({
            transport: { jsonTransport: true },
            defaults: { from: 'noreply@example.com' },
            template: { dir: 'templates' },
          }),
        }),
        AuthModule.forRootFromConfig({
          presentation: authModuleOptions.presentation,
          mailer: { provider: 'node' },
        }),
      ],
    }).compile();

    expect(moduleRef.get(MailerPort, { strict: false })).toBeInstanceOf(
      NodeMailerAdapter,
    );
  });

  it('keeps forRootFromConfig deterministic without legacy persistence env handling', () => {
    expect(() =>
      AuthModule.forRootFromConfig({
        presentation: authModuleOptions.presentation,
      }),
    ).not.toThrow();
  });
});
