import 'reflect-metadata';

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { stringify } from 'yaml';
import {
  isManagedOpenApiPath,
  normalizePath,
  resolveOperationId,
  resolveTags,
  toRouteKey,
} from './route-metadata';
import { AuthService } from '../../libs/auth/nest/src/application/services/auth.service';
import { AuthController } from '../../libs/auth/nest/src/presentation/controllers/auth.controller';
import { FormsService } from '../../libs/forms/nest/src/application/services/forms.service';
import { SubmissionsService } from '../../libs/forms/nest/src/application/services/submissions.service';
import { FormsController } from '../../libs/forms/nest/src/presentation/controllers/forms.controller';
import { SubmissionsController } from '../../libs/forms/nest/src/presentation/controllers/submissions.controller';

const OUTPUT_DIR = join(process.cwd(), 'docs/openapi');
const JSON_OUTPUT = join(OUTPUT_DIR, 'openapi.json');
const YAML_OUTPUT = join(OUTPUT_DIR, 'openapi.yaml');

const authServiceStub: AuthService = {
  registerUser: async () => ({ success: true }),
  activateUser: async () => ({ success: true }),
  login: async () => ({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  }),
  logout: async () => ({ success: true }),
  changePassword: async () => ({ success: true }),
  forgotPassword: async () => ({ success: true }),
  resetPassword: async () => ({ success: true }),
  verifyEmail: async () => ({ success: true }),
  updateEmail: async () => ({ success: true }),
  refreshTokens: async () => ({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  }),
  getLoggedInUserInfo: async () => ({
    user: {
      id: 'doc-user',
      email: 'doc@example.com',
      userName: 'docs',
      passwordHash: '',
      token: null,
      isActive: true,
      roles: [],
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
      updatedAt: new Date('2020-01-01T00:00:00.000Z'),
    },
    rbac: [],
  }),
};

const formsServiceStub: Pick<FormsService, 'getDefinition'> = {
  getDefinition: async () => ({
    config: {
      id: 'contact_default',
      version: 1,
      fields: [],
    },
    schema: {},
  }),
};

const submissionsServiceStub: Pick<SubmissionsService, 'submit'> = {
  submit: async (input: Record<string, unknown>) => ({
    id: 'doc-submission',
    formId: (input.formId as string) ?? 'contact_default',
    formVersion: (input.formVersion as number) ?? 1,
    payload: (input.payload as Record<string, unknown>) ?? {},
    createdAt: new Date('2020-01-01T00:00:00.000Z'),
    updatedAt: new Date('2020-01-01T00:00:00.000Z'),
  }),
};

@Module({
  controllers: [AuthController, FormsController, SubmissionsController],
  providers: [
    {
      provide: AuthService,
      useValue: authServiceStub,
    },
    {
      provide: FormsService,
      useValue: formsServiceStub,
    },
    {
      provide: SubmissionsService,
      useValue: submissionsServiceStub,
    },
  ],
})
class ApiSpecsModule {}

function sortDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sortDeep(item)) as T;
  }

  if (value && typeof value === 'object') {
    const sortedEntries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nestedValue]) => [key, sortDeep(nestedValue)]);

    return Object.fromEntries(sortedEntries) as T;
  }

  return value;
}

function normalizeMethods(method: string | string[] | undefined): string[] {
  if (!method) {
    return [];
  }

  const methodList = Array.isArray(method) ? method : [method];
  return methodList.map((value) => value.toUpperCase());
}

async function run() {
  const adapter = new FastifyAdapter({ logger: false });
  const missingOperationIdKeys = new Set<string>();

  await adapter.register(fastifySwagger as never, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Anarchitecture Bricks API',
        version: '1.0.0',
        description:
          'Implementation-derived OpenAPI generated from Nest presentation controllers and RouteSchema metadata.',
        contact: {
          name: 'Anarchitects Team',
          email: 'info@anarchitects.dev',
          url: 'https://github.com/anarchitects/anarchitecture-bricks-3tier',
        },
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Local',
        },
      ],
      tags: [{ name: 'Auth' }, { name: 'Forms' }],
    },
    hideUntagged: false,
    transform: ({ schema, url, route }: {
      schema: Record<string, unknown>;
      url: string;
      route: { method?: string | string[] };
    }) => {
      const normalizedUrl = normalizePath(url);

      if (!isManagedOpenApiPath(normalizedUrl)) {
        return { schema, url: normalizedUrl };
      }

      const methods = normalizeMethods(route.method).filter(
        (method) => method !== 'HEAD'
      );

      if (methods.length === 0) {
        return { schema, url: normalizedUrl };
      }

      const transformedSchema: Record<string, unknown> = { ...schema };

      for (const method of methods) {
        try {
          const operationId = resolveOperationId(method, normalizedUrl);
          transformedSchema['operationId'] = operationId;
        } catch {
          missingOperationIdKeys.add(toRouteKey(method, normalizedUrl));
        }
      }

      const tags = resolveTags(normalizedUrl);
      if (tags.length > 0) {
        transformedSchema['tags'] = tags;
      }

      return { schema: transformedSchema, url: normalizedUrl };
    },
  });

  await adapter.register(fastifySwaggerUi as never, {
    routePrefix: '/docs',
    staticCSP: true,
    transformSpecificationClone: true,
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    ApiSpecsModule,
    adapter,
    { logger: false }
  );

  await app.init();

  const fastify = app.getHttpAdapter().getInstance();
  await fastify.ready();

  if (missingOperationIdKeys.size > 0) {
    const missingList = [...missingOperationIdKeys].sort().join('\n- ');
    throw new Error(
      `Missing operationId mappings for managed routes:\n- ${missingList}\n\nAdd entries to tools/api-specs/route-metadata.ts (OPERATION_ID_MAP).`
    );
  }

  const openApiDocument = sortDeep(fastify.swagger());

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(JSON_OUTPUT, `${JSON.stringify(openApiDocument, null, 2)}\n`);
  writeFileSync(YAML_OUTPUT, `${stringify(openApiDocument)}\n`);

  await app.close();

  console.log(`Generated OpenAPI artifacts:\n- ${JSON_OUTPUT}\n- ${YAML_OUTPUT}`);
}

run().catch((error) => {
  console.error('Failed to generate OpenAPI specification.');
  console.error(error);
  process.exit(1);
});
