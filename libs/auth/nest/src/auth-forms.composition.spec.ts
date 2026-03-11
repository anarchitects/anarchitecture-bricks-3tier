import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import {
  CommonMailerModule,
  mailerConfig,
} from '@anarchitects/common-nest-mailer';
import { FormsModule } from '@anarchitects/forms-nest';
import {
  FormsController,
  SubmissionsController,
} from '@anarchitects/forms-nest/presentation';
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

describe('Auth/Forms centralized mailer composition', () => {
  it('compiles both domains with a single root mailer setup', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [mailerConfig],
        }),
        CommonMailerModule.forRootFromConfig(),
        TypeOrmTestingModule,
        AuthModule.forRoot({
          application: {
            authStrategies: ['jwt'],
            encryption: {
              algorithm: 'bcrypt',
              key: 'test-key',
            },
          },
          persistence: { persistence: 'typeorm' },
          features: { mailer: true },
        }),
        FormsModule.forRoot({
          features: { mailer: true },
        }),
      ],
    }).compile();

    expect(moduleRef.get(AuthController, { strict: false })).toBeDefined();
    expect(moduleRef.get(FormsController, { strict: false })).toBeDefined();
    expect(
      moduleRef.get(SubmissionsController, { strict: false }),
    ).toBeDefined();
  });
});
