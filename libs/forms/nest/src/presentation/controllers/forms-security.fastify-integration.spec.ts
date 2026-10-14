import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { MailerPort } from '@anarchitects/common-nest-mailer';
import type { FormConfig } from '@anarchitects/forms-ts/models';
import { FormsService } from '../../application/services/forms.service';
import { SubmissionsService } from '../../application/services/submissions.service';
import {
  FormConfigsRepository,
  SubmissionsRepository,
} from '../../infrastructure-persistence';
import { FormsController } from './forms.controller';
import { SubmissionsController } from './submissions.controller';

const secret = 'rotation-fixture-never-public';
const configuration: FormConfig = {
  id: 'contact',
  version: 1,
  fields: [
    { name: 'email', kind: 'email', required: true },
    { name: 'confirmEmail', kind: 'email', required: true },
    { name: 'note', kind: 'string', maxLength: 10 },
    {
      name: 'choice',
      kind: 'select',
      minLength: 2,
      maxLength: 4,
      pattern: '^a',
      options: ['a', 'ab', 'abcdx', 'bc'].map((value) => ({
        value,
        label: value,
      })),
    },
  ],
  validationRules: [
    { kind: 'matchFields', sourceField: 'email', targetField: 'confirmEmail' },
  ],
  delivery: {
    adminEmail: 'private@example.test',
    webhooks: [{ url: 'https://credential@example.test/hook', secret }],
  },
};
const valid = {
  email: 'reader@example.test',
  confirmEmail: 'reader@example.test',
};

describe('Forms D05/D08 HTTP migration', () => {
  let app: NestFastifyApplication;
  const records = {
    createSubmission: jest.fn(async (input) => ({
      ...input,
      id: 'record',
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  };
  const mail = {
    send: jest.fn(),
    sendTemplate: jest.fn(),
    sendMessage: jest.fn(),
  };
  const definitions = {
    getFormConfig: jest.fn(async (id: string, version: number) => {
      if (id !== 'contact' || ![1, 2].includes(version))
        throw new NotFoundException();
      return version === 1
        ? configuration
        : {
            ...configuration,
            version: 2,
            fields: [{ name: 'message', kind: 'string', required: true }],
            validationRules: [],
          };
    }),
  };
  const logs: unknown[] = [];
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [FormsController, SubmissionsController],
      providers: [
        FormsService,
        SubmissionsService,
        { provide: FormConfigsRepository, useValue: definitions },
        { provide: SubmissionsRepository, useValue: records },
        { provide: MailerPort, useValue: mail },
      ],
    }).compile();
    app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({
        schemaErrorFormatter: () => new BadRequestException('Invalid request.'),
      }),
    );
    app.useLogger({
      log(...values: unknown[]) {
        logs.push(values);
      },
      warn(...values: unknown[]) {
        logs.push(values);
      },
      error(...values: unknown[]) {
        logs.push(values);
      },
    });
    // A deliberately bounded host-binding fixture, not a production auth provider.
    app.useGlobalGuards({
      canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        if (!request.headers.authorization) throw new UnauthorizedException();
        if (request.headers.authorization !== 'Bearer scoped-contact')
          throw new ForbiddenException();
        if (request.params.formId && request.params.formId !== 'contact')
          throw new ForbiddenException();
        if (request.body?.formId && request.body.formId !== 'contact')
          throw new ForbiddenException();
        return true;
      },
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    logs.length = 0;
  });
  afterAll(async () => {
    await app.close();
  });
  const headers = { authorization: 'Bearer scoped-contact' };
  const submit = (payload: unknown, formVersion = 1) =>
    app.inject({
      method: 'POST',
      url: '/forms/submit',
      headers,
      payload: { formId: 'contact', formVersion, payload },
    });

  it.each([
    {},
    { ...valid, email: 'invalid' },
    { ...valid, email: 123 },
    { ...valid, extra: true },
    { ...valid, confirmEmail: 'other@example.test' },
    { ...valid, note: 'too-long-for-limit' },
    { ...valid, choice: 'not-an-option' },
    { ...valid, choice: 'a' },
    { ...valid, choice: 'abcdx' },
    { ...valid, choice: 'bc' },
  ])(
    'rejects invalid dynamic payload without storage or mail: %p',
    async (payload) => {
      const result = await submit(payload);
      expect(result.statusCode).toBe(400);
      expect(result.json()).toEqual({
        statusCode: 400,
        message: 'Invalid form submission.',
        error: 'Bad Request',
      });
      expect(records.createSubmission).not.toHaveBeenCalled();
      expect(mail.send).not.toHaveBeenCalled();
      expect(mail.sendTemplate).not.toHaveBeenCalled();
    },
  );
  it('accepts a listed option satisfying its length and pattern rules', async () => {
    expect((await submit({ ...valid, choice: 'ab' })).statusCode).toBe(200);
    expect(records.createSubmission).toHaveBeenCalledTimes(1);
    expect(mail.send).toHaveBeenCalledTimes(1);
  });
  it('validates the exact version and permits omitted optional fields', async () => {
    expect((await submit(valid)).statusCode).toBe(200);
    expect((await submit(valid, 2)).statusCode).toBe(400);
    expect((await submit({ message: 'hello' }, 2)).statusCode).toBe(200);
    expect(definitions.getFormConfig).toHaveBeenLastCalledWith('contact', 2);
    expect(records.createSubmission).toHaveBeenCalledTimes(2);
    expect(mail.send).toHaveBeenCalledTimes(2);
  });
  it('keeps missing definitions distinct from invalid fields', async () => {
    expect((await submit(valid, 9)).statusCode).toBe(404);
    expect(records.createSubmission).not.toHaveBeenCalled();
  });
  it('removes delivery data before serialization and remains safe after rotation', async () => {
    for (const key of [secret, 'rotated-fixture-key']) {
      definitions.getFormConfig.mockResolvedValueOnce({
        ...configuration,
        delivery: {
          ...configuration.delivery,
          webhooks: [
            { url: 'https://credential@example.test/hook', secret: key },
          ],
        },
      });
      const response = await app.inject({
        method: 'GET',
        url: '/forms/contact',
        headers,
      });
      expect(response.statusCode).toBe(200);
      expect(response.json().config).not.toHaveProperty('delivery');
      for (const privateValue of [
        key,
        'private@example.test',
        'credential@example.test',
      ])
        expect(response.body).not.toContain(privateValue);
    }
  });
  it.each([undefined, 'Bearer wrong-resource'])(
    'requires host authentication and resource authorization: %s',
    async (authorization) => {
      const response = await app.inject({
        method: 'GET',
        url: '/forms/contact',
        headers: authorization ? { authorization } : {},
      });
      expect(response.statusCode).toBe(authorization ? 403 : 401);
      expect(definitions.getFormConfig).not.toHaveBeenCalled();
      expect(response.body).not.toContain(secret);
    },
  );
  it('denies other resources before fetching them', async () => {
    expect(
      (await app.inject({ method: 'GET', url: '/forms/other', headers }))
        .statusCode,
    ).toBe(403);
    expect(definitions.getFormConfig).not.toHaveBeenCalled();
  });
  it('sanitizes adapter failures in responses and framework logs', async () => {
    definitions.getFormConfig.mockRejectedValueOnce(new Error(secret));
    const response = await app.inject({
      method: 'GET',
      url: '/forms/contact',
      headers,
    });
    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain(secret);
    expect(JSON.stringify(logs)).not.toContain(secret);
    records.createSubmission.mockRejectedValueOnce(new Error(secret));
    const submission = await submit(valid);
    expect(submission.statusCode).toBe(500);
    expect(submission.body).not.toContain(secret);
    expect(JSON.stringify(logs)).not.toContain(secret);
    expect(mail.send).not.toHaveBeenCalled();
  });
});
