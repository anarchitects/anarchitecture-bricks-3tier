import { MailerService } from '@nestjs-modules/mailer';
import { Global, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import {
  MailerPort,
  NoopMailerAdapter,
} from '@anarchitects/common-nest-mailer';
import { NestMailerAdapter } from './infrastructure-mailer/adapters/node-mailer.adapter';
import { FormsController } from './presentation/controllers/forms.controller';
import { SubmissionsController } from './presentation/controllers/submissions.controller';
import { FormsModule } from './forms.module';
import { FormsPresentationModule } from './presentation';

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

const mailerServiceStub = {
  sendMail: jest.fn(),
};

@Global()
@Module({
  providers: [
    { provide: getDataSourceToken(), useValue: dataSourceStub },
    { provide: MailerService, useValue: mailerServiceStub },
  ],
  exports: [getDataSourceToken(), MailerService],
})
class InfrastructureTestingModule {}

const ORIGINAL_FORMS_ENV = {
  persistence: process.env['FORMS_PERSISTENCE'],
  mailerEnabled: process.env['FORMS_MAILER_ENABLED'],
};

describe('FormsModule', () => {
  afterEach(() => {
    if (ORIGINAL_FORMS_ENV.persistence === undefined) {
      delete process.env['FORMS_PERSISTENCE'];
    } else {
      process.env['FORMS_PERSISTENCE'] = ORIGINAL_FORMS_ENV.persistence;
    }

    if (ORIGINAL_FORMS_ENV.mailerEnabled === undefined) {
      delete process.env['FORMS_MAILER_ENABLED'];
    } else {
      process.env['FORMS_MAILER_ENABLED'] = ORIGINAL_FORMS_ENV.mailerEnabled;
    }
  });

  it('should compile with the real mailer adapter when mailer is enabled', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        InfrastructureTestingModule,
        FormsModule.forRoot({
          mailer: { features: { enabled: true } },
        }),
      ],
    }).compile();

    const formsController = moduleRef.get(FormsController, { strict: false });
    const submissionsController = moduleRef.get(SubmissionsController, {
      strict: false,
    });
    const mailerAdapter = moduleRef.get(MailerPort, { strict: false });

    expect(formsController).toBeDefined();
    expect(submissionsController).toBeDefined();
    expect(mailerAdapter).toBeInstanceOf(NestMailerAdapter);
  });

  it('should compile with a no-op mailer adapter when mailer is disabled', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        InfrastructureTestingModule,
        FormsModule.forRoot({
          mailer: { features: { enabled: false } },
        }),
      ],
    }).compile();

    const formsController = moduleRef.get(FormsController, { strict: false });
    const submissionsController = moduleRef.get(SubmissionsController, {
      strict: false,
    });
    const mailerAdapter = moduleRef.get(MailerPort, { strict: false });

    expect(formsController).toBeDefined();
    expect(submissionsController).toBeDefined();
    expect(mailerAdapter).toBeInstanceOf(NoopMailerAdapter);
  });

  it('should keep backward compatibility when importing FormsPresentationModule directly', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [InfrastructureTestingModule, FormsPresentationModule],
    }).compile();

    const formsController = moduleRef.get(FormsController, { strict: false });
    const submissionsController = moduleRef.get(SubmissionsController, {
      strict: false,
    });

    expect(formsController).toBeDefined();
    expect(submissionsController).toBeDefined();
  });

  it('should forward nested persistence overrides through presentation and application modules', () => {
    expect(() =>
      FormsModule.forRoot({
        presentation: {
          application: {
            persistence: {
              persistence: 'unsupported',
            },
          },
        },
      }),
    ).toThrow('Unsupported persistence type: unsupported');
  });

  it('should keep forRoot explicit and ignore env defaults', async () => {
    process.env['FORMS_MAILER_ENABLED'] = 'false';

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [InfrastructureTestingModule, FormsModule.forRoot()],
    }).compile();

    const mailerAdapter = moduleRef.get(MailerPort, { strict: false });
    expect(mailerAdapter).toBeInstanceOf(NestMailerAdapter);
  });

  it('should resolve env defaults through forRootFromConfig', async () => {
    process.env['FORMS_MAILER_ENABLED'] = 'false';

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [InfrastructureTestingModule, FormsModule.forRootFromConfig()],
    }).compile();

    const mailerAdapter = moduleRef.get(MailerPort, { strict: false });
    expect(mailerAdapter).toBeInstanceOf(NoopMailerAdapter);
  });
});
