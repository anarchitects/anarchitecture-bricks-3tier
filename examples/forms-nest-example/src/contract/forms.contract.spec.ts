import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import jestOpenAPI from 'jest-openapi';
import { AppModule } from '../app/app.module';

describe('forms-nest-example contract', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const openApiPath = join(
      __dirname,
      '../../../../docs/openapi/openapi.json',
    );
    const document = JSON.parse(readFileSync(openApiPath, 'utf8'));
    jestOpenAPI(document as any);

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
    if (app) {
      await app.close();
    }
  });

  it('GET /forms/contact_default matches OpenAPI spec', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/forms/contact_default',
    });

    expect(response.statusCode).toBe(200);
    expect({
      status: response.statusCode,
      body: JSON.parse(response.body),
      headers: response.headers,
      req: {
        method: 'GET',
        path: '/forms/contact_default',
      },
    }).toSatisfyApiSpec();
  });

  it('POST /forms/submit matches OpenAPI spec', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/forms/submit',
      payload: {
        formId: 'contact_default',
        formVersion: 1,
        payload: {
          name: 'Doc User',
          email: 'doc@example.com',
          message: 'Hello from contract test',
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect({
      status: response.statusCode,
      body: JSON.parse(response.body),
      headers: response.headers,
      req: {
        method: 'POST',
        path: '/forms/submit',
      },
    }).toSatisfyApiSpec();
  });
});
