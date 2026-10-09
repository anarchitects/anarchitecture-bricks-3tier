import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BadRequestException, Injectable, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type Mail from 'nodemailer/lib/mailer';
import type MailMessage from 'nodemailer/lib/mailer/mail-message';
import type { SentMessageInfo, Transport } from 'nodemailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import {
  CommonMailerModule,
  MailerPort,
  NodeMailerAdapter,
  NoopMailerAdapter,
} from '@anarchitects/common-nest-mailer';
import { FormsModule } from '@anarchitects/forms-nest';
import {
  FormsService,
  SubmissionsService,
} from '@anarchitects/forms-nest/application';
import {
  formsConfig,
  InjectFormsConfig,
  type FormsConfig,
} from '@anarchitects/forms-nest/config';
import { FormsInfrastructureMailerModule } from '@anarchitects/forms-nest/infrastructure-mailer';
import { FormsPresentationModule } from '@anarchitects/forms-nest/presentation';
import {
  FormConfigEntity,
  SubmissionEntity,
  FormConfigsRepository,
  SubmissionsRepository,
  CreateFormsTables1720300000000,
  AddValidationRulesToFormConfigs1720310000000,
} from '@anarchitects/forms-nest/infrastructure-persistence';
import type { FormConfig } from '@anarchitects/forms-ts';
import type { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { schemaFromConfig } from '@anarchitects/forms-ts/builders';
import { toSubmissionResponseDTO } from '@anarchitects/forms-ts/mappers';
import { IdentityModule } from '@anarchitects/identity-nest';
import { GetUserProfileService } from '@anarchitects/identity-nest/application';
import {
  identityConfig,
  InjectIdentityConfig,
  type IdentityConfig,
} from '@anarchitects/identity-nest/config';
import { IdentityInfrastructureModule } from '@anarchitects/identity-nest/infrastructure';
import { IdentityPresentationModule } from '@anarchitects/identity-nest/presentation';
import {
  UserProfileEntity,
  UserProfilesRepository,
  CreateIdentitySchema1720400000000,
} from '@anarchitects/identity-nest/infrastructure-persistence';
import type { CreateUserProfileRequestDTO } from '@anarchitects/identity-ts';

export const identities = {
  Module,
  FormsModule,
  FormsService,
  IdentityModule,
  UserProfilesRepository,
  MailerPort,
};

@Injectable()
class ConfigConsumer {
  constructor(
    @InjectFormsConfig() readonly forms: FormsConfig,
    @InjectIdentityConfig() readonly identity: IdentityConfig,
  ) {}
}

class CaptureTransport implements Transport {
  name = 'forms-identity-host';
  version = '1.0.0';
  messages: Mail.Options[] = [];
  closed = false;
  send(
    mail: MailMessage,
    callback: (error: Error | null, info?: SentMessageInfo) => void,
  ) {
    this.messages.push(mail.data);
    callback(null, { messageId: `host-${this.messages.length}` });
  }
  close() {
    this.closed = true;
  }
}

type Mode = 'explicit' | 'config' | 'override' | 'advanced';
async function bootstrap(mode: Mode, transport: CaptureTransport) {
  // Explicit initialization must ignore environment defaults; config overrides
  // must win while the injected config namespace still exposes the env values.
  process.env['FORMS_MAILER_PROVIDER'] = mode === 'override' ? 'node' : 'noop';
  process.env['FORMS_PERSISTENCE'] = 'typeorm';
  const nodeMailer = mode === 'explicit' || mode === 'advanced';
  const templateDir = resolve('templates');
  mkdirSync(templateDir, { recursive: true });
  writeFileSync(resolve(templateDir, 'reply.hbs'), '<p>Received {{email}}</p>');
  const forms =
    mode === 'advanced'
      ? [
          FormsPresentationModule.forRoot(),
          FormsInfrastructureMailerModule.forRoot({ provider: 'node' }),
        ]
      : [
          mode === 'explicit'
            ? FormsModule.forRoot({ mailer: { provider: 'node' } })
            : FormsModule.forRootFromConfig(
                mode === 'override' ? { mailer: { provider: 'noop' } } : {},
              ),
        ];
  const identity =
    mode === 'advanced'
      ? [
          IdentityPresentationModule.forRoot(),
          IdentityInfrastructureModule.forRoot(),
        ]
      : [
          mode === 'explicit'
            ? IdentityModule.forRoot()
            : IdentityModule.forRootFromConfig(),
        ];
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        ignoreEnvFile: true,
        load: [formsConfig, identityConfig],
      }),
      TypeOrmModule.forRoot({
        type: 'postgres',
        url: process.env['FORMS_IDENTITY_HOST_DATABASE_URL'],
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: true,
        migrations: [
          CreateFormsTables1720300000000,
          AddValidationRulesToFormConfigs1720310000000,
          CreateIdentitySchema1720400000000,
        ],
      }),
      ...(nodeMailer
        ? [
            CommonMailerModule.forRootAsync({
              useFactory: () => ({
                transport,
                defaults: { from: 'forms@example.test' },
                template: {
                  dir: templateDir,
                  adapter: new HandlebarsAdapter(),
                },
              }),
            }),
          ]
        : []),
      ...forms,
      ...identity,
    ],
    providers: [ConfigConsumer],
  }).compile();
  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({
      // Nest 12 requires a Nest HTTP exception for Fastify schema failures.
      schemaErrorFormatter: (errors, dataVar) =>
        new BadRequestException(
          `${dataVar} ${errors.map((e) => e.message).join(', ')}`,
        ),
    }),
    { logger: false },
  );
  try {
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    assert.ok(
      app.get(MailerPort) instanceof
        (nodeMailer ? NodeMailerAdapter : NoopMailerAdapter),
    );
    assert.equal(
      app.get(ConfigConsumer).forms.mailerProvider,
      mode === 'override' ? 'node' : 'noop',
    );
    assert.deepEqual(app.get(ConfigConsumer).identity, {});
    assert.ok(app.get(FormsService));
    assert.ok(app.get(SubmissionsService));
    assert.ok(app.get(GetUserProfileService));
    return app;
  } catch (error) {
    await app.close();
    throw error;
  }
}

async function expectStatus(
  app: NestFastifyApplication,
  method: 'GET' | 'POST' | 'PATCH',
  url: string,
  status: number,
  payload?: object,
) {
  const response = await app.inject({
    method,
    url,
    ...(payload ? { payload } : {}),
  });
  assert.equal(
    response.statusCode,
    status,
    `${method} ${url}: ${response.body}`,
  );
  return response.json();
}

export async function runConsumer() {
  let submissionId: string | undefined;
  let profileId: string | undefined;
  const authUserId = randomUUID();
  for (const mode of ['explicit', 'config', 'override', 'advanced'] as const) {
    const transport = new CaptureTransport();
    const app = await bootstrap(mode, transport);
    try {
      const db = app.get(DataSource);
      assert.equal(await db.showMigrations(), false);
      assert.equal((await db.query('SELECT * FROM migrations')).length, 3);
      assert.equal(db.getMetadata(UserProfileEntity).relations.length, 0);
      const config: FormConfig = {
        id: 'contact',
        version: 1,
        fields: [{ name: 'email', kind: 'email', required: true }],
        validationRules: [],
        delivery: {
          adminEmail: 'admin@example.test',
          subject: 'Contact received',
          autoReply: {
            enabled: true,
            templateId: 'reply',
            subject: 'Thank you',
          },
        },
      };
      await db
        .getRepository(FormConfigEntity)
        .save(new FormConfigEntity(config));
      await db.getRepository(FormConfigEntity).save(
        new FormConfigEntity({
          ...config,
          version: 2,
          fields: [{ name: 'name', kind: 'string' }],
        }),
      );
      const definition = await expectStatus(app, 'GET', '/forms/contact', 200);
      assert.equal(definition.config.version, 1);
      assert.deepEqual(definition.config.fields, config.fields);
      assert.deepEqual(definition.config.validationRules, []);
      assert.deepEqual(
        definition.schema,
        JSON.parse(JSON.stringify(schemaFromConfig(config))),
      );
      assert.equal(
        (await expectStatus(app, 'GET', '/forms/contact?formVersion=2', 200))
          .config.version,
        2,
      );
      assert.equal(
        (await app.get(FormConfigsRepository).getFormConfig('contact', 2))
          .fields[0].name,
        'name',
      );
      await expectStatus(app, 'GET', '/forms/missing', 404);
      await expectStatus(app, 'GET', '/forms/contact?formVersion=bad', 400);
      await expectStatus(app, 'POST', '/forms/submit', 400, {
        formId: 'contact',
        formVersion: 0,
      });
      await expectStatus(app, 'POST', '/forms/submit', 404, {
        formId: 'missing',
        formVersion: 1,
        payload: {},
      });
      const request: SubmissionRequestDTO = {
        formId: 'contact',
        formVersion: 1,
        payload: { email: 'visitor@example.test', mode },
      };
      const created = await expectStatus(
        app,
        'POST',
        '/forms/submit',
        200,
        request,
      );
      assert.match(created.id, /^[0-9a-f-]{36}$/);
      assert.deepEqual(created.payload, request.payload);
      const stored = await app
        .get(SubmissionsRepository)
        .getSubmission({ id: created.id });
      assert.ok(stored);
      assert.deepEqual(toSubmissionResponseDTO(stored), created);
      assert.deepEqual(
        await expectStatus(app, 'GET', `/forms/submissions/${created.id}`, 200),
        created,
      );
      const filtered = await expectStatus(
        app,
        'GET',
        '/forms/submissions?formId=contact&formVersion=1',
        200,
      );
      assert.ok(filtered.some((s: { id: string }) => s.id === created.id));
      assert.deepEqual(
        await expectStatus(app, 'GET', '/forms/submissions?formVersion=2', 200),
        [],
      );
      await expectStatus(app, 'GET', '/forms/submissions?formVersion=bad', 400);
      await expectStatus(app, 'GET', `/forms/submissions/${randomUUID()}`, 404);
      if (mode === 'explicit' || mode === 'advanced') {
        assert.equal(transport.messages.length, 2);
        assert.equal(transport.messages[0].to, 'admin@example.test');
        assert.equal(transport.messages[0].from, 'forms@example.test');
        assert.equal(transport.messages[0].subject, 'Contact received');
        assert.match(
          String(transport.messages[0].html),
          /visitor@example.test/,
        );
        assert.equal(transport.messages[1].to, 'visitor@example.test');
        assert.equal(transport.messages[1].subject, 'Thank you');
        assert.match(
          String(transport.messages[1].html),
          /Received visitor@example.test/,
        );
      } else assert.equal(transport.messages.length, 0);

      if (!profileId) {
        const profile: CreateUserProfileRequestDTO = {
          authUserId,
          displayName: 'Host user',
          locale: 'en',
        };
        const createdProfile = await expectStatus(
          app,
          'POST',
          '/identity/profiles',
          200,
          profile,
        );
        profileId = createdProfile.id;
        assert.match(createdProfile.id, /^[0-9a-f-]{36}$/);
        assert.equal(createdProfile.authUserId, authUserId);
        assert.equal(createdProfile.givenName, null);
        assert.ok(Number.isFinite(Date.parse(createdProfile.createdAt)));
      }
      const byId = await expectStatus(
        app,
        'GET',
        `/identity/profiles/${profileId}`,
        200,
      );
      assert.deepEqual(
        await expectStatus(
          app,
          'GET',
          `/identity/profiles/by-auth-user/${authUserId}`,
          200,
        ),
        byId,
      );
      await expectStatus(app, 'POST', '/identity/profiles', 400, {
        authUserId,
      });
      await expectStatus(app, 'POST', '/identity/profiles', 400, {
        displayName: 'Missing authUserId',
      });
      await expectStatus(app, 'PATCH', `/identity/profiles/${profileId}`, 400, {
        displayName: { invalid: true },
      });
      const patched = await expectStatus(
        app,
        'PATCH',
        `/identity/profiles/${profileId}`,
        200,
        { displayName: mode, locale: 'en-BE' },
      );
      assert.equal(patched.displayName, mode);
      assert.equal(patched.locale, 'en-BE');
      assert.equal(patched.authUserId, authUserId);
      // Fastify's default body coercion turns null strings into empty strings
      // on both majors. Exercise persistence nulls through the repository port.
      await app
        .get(UserProfilesRepository)
        .update({ id: patched.id, locale: null });
      assert.equal(
        (await expectStatus(app, 'GET', `/identity/profiles/${profileId}`, 200))
          .locale,
        null,
      );
      assert.equal(
        (await app.get(UserProfilesRepository).findByAuthUserId(authUserId))
          ?.displayName,
        mode,
      );
      await expectStatus(app, 'GET', `/identity/profiles/${randomUUID()}`, 404);
      await expectStatus(
        app,
        'GET',
        `/identity/profiles/by-auth-user/${randomUUID()}`,
        404,
      );
      await expectStatus(
        app,
        'PATCH',
        `/identity/profiles/${randomUUID()}`,
        404,
        { displayName: 'Missing' },
      );
      // Persistence survives application shutdown and both facade/composed boots.
      if (submissionId)
        assert.equal(
          (
            await expectStatus(
              app,
              'GET',
              `/forms/submissions/${submissionId}`,
              200,
            )
          ).id,
          submissionId,
        );
      submissionId = created.id;
      assert.equal(await db.getRepository(UserProfileEntity).count(), 1);
      // The exported migration enforces unique auth ownership at the DB layer.
      await assert.rejects(
        db.query(
          'INSERT INTO identity.user_profiles (id, auth_user_id) VALUES ($1, $2)',
          [randomUUID(), authUserId],
        ),
        (error: { code?: string }) => error.code === '23505',
      );
      assert.equal(
        await db.getRepository(SubmissionEntity).count(),
        ['explicit', 'config', 'override', 'advanced'].indexOf(mode) + 1,
      );
      console.log(
        `Forms/Identity ${mode}: migrations, HTTP contracts, repositories and mail passed.`,
      );
    } finally {
      await app.close();
    }
    if (mode === 'explicit' || mode === 'advanced')
      assert.equal(transport.closed, true);
  }
}
