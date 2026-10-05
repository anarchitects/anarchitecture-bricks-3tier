import { Submission } from '@anarchitects/forms-ts/models';
import { toSubmissionResponseDTO } from '@anarchitects/forms-ts/mappers';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubmissionsService } from '../../application/services/submissions.service';
import { FormsService } from '../../application/services/forms.service';
import { SubmissionEntity } from '../../infrastructure-persistence/entities/submission.entity';
import { SubmissionsRepository } from '../../infrastructure-persistence/repositories/submissions.repository';
import { TypeOrmSubmissionsRepository } from '../../infrastructure-persistence/repositories/typeorm-submissions.repository';
import { FormsController } from './forms.controller';
import { SubmissionsController } from './submissions.controller';

const submissions: Submission[] = [
  {
    id: '01900000-0000-7000-8000-000000000001',
    formId: 'contact',
    formVersion: 1,
    payload: { message: 'First' },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  {
    id: '01900000-0000-7000-8000-000000000002',
    formId: 'contact',
    formVersion: 2,
    payload: { message: 'Second' },
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  },
  {
    id: '01900000-0000-7000-8000-000000000003',
    formId: 'feedback',
    formVersion: 1,
    payload: {},
    createdAt: new Date('2026-01-03T00:00:00.000Z'),
    updatedAt: new Date('2026-01-03T00:00:00.000Z'),
  },
];

describe('submissions read HTTP pipeline', () => {
  let app: NestFastifyApplication;
  const persistence = {
    find: jest.fn(async (options?: { where: Partial<Submission> }) =>
      submissions.filter((entry) =>
        Object.entries(options?.where ?? {}).every(
          ([key, value]) => entry[key as keyof Submission] === value,
        ),
      ),
    ),
    findOne: jest.fn(
      async ({ where }: { where: { id: string } }) =>
        submissions.find((entry) => entry.id === where.id) ?? null,
    ),
  };
  const formsService = { getDefinition: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [FormsController, SubmissionsController],
      providers: [
        SubmissionsService,
        { provide: FormsService, useValue: formsService },
        {
          provide: SubmissionsRepository,
          useClass: TypeOrmSubmissionsRepository,
        },
        {
          provide: getRepositoryToken(SubmissionEntity),
          useValue: persistence,
        },
      ],
    }).compile();
    app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({ logger: false }),
    );
    app.useLogger(false);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });
  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => {
    await app?.close();
  });

  it.each([
    ['/forms/submissions', submissions],
    ['/forms/submissions?formId=contact', submissions.slice(0, 2)],
    ['/forms/submissions?formId=contact&formVersion=2', [submissions[1]]],
    ['/forms/submissions?formVersion=1', [submissions[0], submissions[2]]],
    ['/forms/submissions?formId=missing', []],
  ] as const)('lists and serializes %s', async (url, expected) => {
    const response = await app.inject({ method: 'GET', url });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(expected.map(toSubmissionResponseDTO));
    expect(formsService.getDefinition).not.toHaveBeenCalled();
  });

  it('retrieves and serializes one submission', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/forms/submissions/01900000-0000-7000-8000-000000000002',
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(toSubmissionResponseDTO(submissions[1]));
    expect(persistence.findOne).toHaveBeenCalledWith({
      where: { id: '01900000-0000-7000-8000-000000000002' },
    });
  });

  it('returns 404 for an unknown submission', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/forms/submissions/01900000-0000-7000-8000-000000000099',
    });
    expect(response.statusCode).toBe(404);
  });

  it('rejects invalid UUIDs before persistence', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/forms/submissions/not-a-uuid',
    });
    expect(response.statusCode).toBe(400);
    expect(persistence.findOne).not.toHaveBeenCalled();
  });

  it.each([
    'formVersion=0',
    'formVersion=-1',
    'formVersion=1.5',
    'formVersion=nope',
    'formId=',
  ])('rejects invalid query %s before persistence', async (query) => {
    const response = await app.inject({
      method: 'GET',
      url: `/forms/submissions?${query}`,
    });
    expect(response.statusCode).toBe(400);
    expect(persistence.find).not.toHaveBeenCalled();
  });
});
