import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Value } from '@sinclair/typebox/value';
import type { TSchema } from '@sinclair/typebox';
import {
  LoginRequestSchema,
  RegisterRequestSchema,
} from '@anarchitects/auth-ts/dtos';
import {
  SubmissionRequestSchema,
  SubmissionsQuerySchema,
  SubmissionResponseSchema,
} from '@anarchitects/forms-ts/dtos';
import { UpdateUserProfileRequestSchema } from '@anarchitects/identity-ts';
import {
  NewsletterSubscriptionRequestSchema,
  NewsletterNativeActionRequestSchema,
} from '@anarchitects/newsletter-ts/dtos';

const revision = 'ecda1b6e0d9bc39c66373452a92dce91e06abee0';
// This probe uses the installed validator against frozen source schemas, not a service stub's business rules.
const diff = execFileSync(
  'git',
  [
    'diff',
    revision,
    '--',
    'libs/auth',
    'libs/forms',
    'libs/identity',
    'libs/newsletter',
    'package.json',
    'yarn.lock',
  ],
  { encoding: 'utf8' },
);
if (diff.trim())
  throw new Error(
    'Restore the frozen library/dependency baseline before running this probe.',
  );
const require = createRequire(import.meta.url);
const version = (name: string): string => {
  let directory = dirname(require.resolve(name));
  while (true) {
    const manifest = join(directory, 'package.json');
    if (existsSync(manifest)) {
      const pkg = JSON.parse(readFileSync(manifest, 'utf8')) as {
        name?: string;
        version: string;
      };
      if (pkg.name === name) return pkg.version;
    }
    const parent = dirname(directory);
    if (parent === directory)
      throw new Error(`Cannot locate version for ${name}`);
    directory = parent;
  }
};
const profiles = [
  {
    name: 'auth-login',
    schema: LoginRequestSchema,
    inputs: [
      { credential: 'a@example.test', password: 'Password123!' },
      { credential: 'a@example.test', password: 12345678 },
      { credential: 'a@example.test', password: 'Password123!', extra: true },
      { credential: 'a@example.test', password: '' },
    ],
  },
  {
    name: 'auth-register',
    schema: RegisterRequestSchema,
    inputs: [
      {
        email: 'a@example.test',
        password: 'Password123!',
        confirmPassword: 'different',
      },
      {
        email: 'bad',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      },
    ],
  },
  {
    name: 'forms-submit',
    schema: SubmissionRequestSchema,
    inputs: [
      {
        formId: 'contact',
        formVersion: '1',
        payload: { unknown: 'preserved' },
        extra: true,
      },
      { formId: 'contact', formVersion: 0, payload: {} },
      { formId: 'contact', formVersion: 1, payload: null },
    ],
  },
  {
    name: 'identity-update',
    schema: UpdateUserProfileRequestSchema,
    inputs: [
      { displayName: null },
      { displayName: 42 },
      { displayName: {} },
      { unknown: 'preserved' },
      {},
    ],
  },
  {
    name: 'newsletter-subscribe',
    schema: NewsletterSubscriptionRequestSchema,
    inputs: [
      { email: 'a@example.test', consent: true, consentVersion: 'v1' },
      { email: 'a@example.test', consent: 'true', consentVersion: 'v1' },
      {
        email: 'a@example.test',
        consent: true,
        consentVersion: 'v1',
        extra: true,
      },
      { email: 'bad', website: 'bot' },
    ],
  },
  {
    name: 'newsletter-native',
    schema: NewsletterNativeActionRequestSchema,
    inputs: [
      { token: '' },
      { token: 123 },
      { token: 'x', extra: true },
      { token: 'x'.repeat(129) },
    ],
  },
];

async function run() {
  const fastify = new FastifyAdapter({ logger: false }).getInstance();
  try {
    for (const profile of profiles) {
      fastify.post(
        `/${profile.name}`,
        { schema: { body: profile.schema } },
        async (request) => request.body,
      );
      if (profile.name.startsWith('newsletter')) {
        fastify.post(
          `/${profile.name}/strict`,
          {
            schema: { body: profile.schema },
            validatorCompiler:
              ({ schema }) =>
              (data: unknown) =>
                Value.Check(schema as TSchema, data)
                  ? { value: data }
                  : { error: new Error('Invalid newsletter request.') },
          },
          async (request) => request.body,
        );
      }
    }
    fastify.get(
      '/forms-query',
      { schema: { querystring: SubmissionsQuerySchema } },
      async (request) => request.query,
    );
    fastify.get(
      '/forms-response',
      { schema: { response: { 200: SubmissionResponseSchema } } },
      async () => ({
        id: 'fixture-id',
        formId: 'contact',
        formVersion: 1,
        payload: { message: 'retained' },
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        internalOnly: 'stripped',
      }),
    );
    await fastify.ready();
    const observations: unknown[] = [];
    for (const profile of profiles) {
      for (const input of profile.inputs) {
        for (const mode of profile.name.startsWith('newsletter')
          ? ['default-ajv', 'newsletter-typebox']
          : ['default-ajv']) {
          const response = await fastify.inject({
            method: 'POST',
            url: `/${profile.name}${mode === 'newsletter-typebox' ? '/strict' : ''}`,
            payload: JSON.parse(JSON.stringify(input)),
          });
          observations.push({
            profile: profile.name,
            mode,
            input,
            status: response.statusCode,
            body: response.json(),
          });
        }
      }
    }
    for (const url of [
      '/forms-query',
      '/forms-query?formVersion=2',
      '/forms-query?formVersion=bad',
      '/forms-query?unknown=kept',
      '/forms-response',
    ]) {
      const response = await fastify.inject({ method: 'GET', url });
      observations.push({
        profile: url,
        mode: 'default-ajv',
        status: response.statusCode,
        body: response.json(),
      });
    }
    const result = {
      evidenceKind:
        'isolated-validator-serializer-probes-not-full-http-conformance',
      revision,
      versions: {
        node: process.version,
        nest: version('@nestjs/core'),
        fastify: version('fastify'),
        typebox: version('@sinclair/typebox'),
      },
      note: 'Real Fastify injection using frozen imported schemas. Newsletter strict compiler matches Value.Check from its presentation module. These synthetic routes omit Nest exception wrapping, authentication, application services, persistence, rate limits and honeypot hooks. Full packed-host evidence is separate.',
      observations,
    };
    mkdirSync('dist/api-audit', { recursive: true });
    writeFileSync(
      'dist/api-audit/validation-probes.json',
      `${JSON.stringify(result, null, 2)}\n`,
    );
    console.log(
      `Recorded ${observations.length} validator/serializer observations.`,
    );
  } finally {
    await fastify.close();
  }
}
run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
