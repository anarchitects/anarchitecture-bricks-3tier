import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { CommonMailerModule } from '@anarchitects/common-nest-mailer';
import { AuthService } from './application';
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

@Global()
@Module({
  providers: [{ provide: getDataSourceToken(), useValue: dataSourceStub }],
  exports: [getDataSourceToken()],
})
class TypeOrmTestingModule {}

describe('AuthModule', () => {
  const createModule = async (mailerEnabled: boolean): Promise<TestingModule> =>
    Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmTestingModule,
        ...(mailerEnabled
          ? [
              CommonMailerModule.forRootAsync({
                useFactory: () => ({
                  transport: { jsonTransport: true },
                  defaults: { from: 'noreply@example.com' },
                  template: { dir: 'templates' },
                }),
              }),
            ]
          : []),
        AuthModule.forRoot({
          application: {
            authStrategies: ['jwt'],
            encryption: {
              algorithm: 'bcrypt',
              key: 'test-key',
            },
          },
          persistence: {
            persistence: 'typeorm',
          },
          features: {
            mailer: mailerEnabled,
          },
        }),
      ],
    }).compile();

  it('should compile and resolve controller/service tokens when mailer is enabled', async () => {
    const moduleRef = await createModule(true);
    const controller = moduleRef.get(AuthController, { strict: false });
    const authService = moduleRef.get(AuthService, { strict: false });

    expect(controller).toBeDefined();
    expect(authService).toBeDefined();
  });

  it('should compile and resolve controller/service tokens when mailer is disabled', async () => {
    const moduleRef = await createModule(false);
    const controller = moduleRef.get(AuthController, { strict: false });
    const authService = moduleRef.get(AuthService, { strict: false });

    expect(controller).toBeDefined();
    expect(authService).toBeDefined();
  });
});
