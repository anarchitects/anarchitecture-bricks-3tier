import assert from 'node:assert/strict';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Exercise packaged exports without workspace aliases or skipLibCheck masking
// declaration errors. No install/network access is required.
const root = process.cwd();
const temp = mkdtempSync(path.join(tmpdir(), 'newsletter-package-'));
try {
  mkdirSync(path.join(temp, 'node_modules/@anarchitects'), { recursive: true });
  for (const layer of ['nest', 'ts']) {
    cpSync(
      path.join(root, 'dist/libs/newsletter', layer),
      path.join(temp, 'node_modules/@anarchitects/newsletter-' + layer),
      { recursive: true },
    );
  }
  cpSync(
    path.join(root, 'dist/libs/common/nest/mailer'),
    path.join(temp, 'node_modules/@anarchitects/common-nest-mailer'),
    { recursive: true },
  );
  for (const dependency of [
    '@nestjs-modules',
    '@sinclair',
    '@types',
    '@nestjs',
    'fastify',
    'rxjs',
    'reflect-metadata',
    'tslib',
    'typeorm',
  ]) {
    symlinkSync(
      path.join(root, 'node_modules', dependency),
      path.join(temp, 'node_modules', dependency),
      'junction',
    );
  }
  const source = `
    import { NewsletterModule, type NewsletterModuleOptions } from '@anarchitects/newsletter-nest';
    import { newsletterConfig, mapNewsletterConfigToOptions } from '@anarchitects/newsletter-nest/config';
    import { NewsletterPresentationModule, InMemoryNewsletterRateLimiter, type NewsletterRateLimiterPort } from '@anarchitects/newsletter-nest/presentation';
    const limiter: NewsletterRateLimiterPort = new InMemoryNewsletterRateLimiter();
    void [newsletterConfig, mapNewsletterConfigToOptions, NewsletterPresentationModule, limiter];

    import { NewsletterSubscriptionService, NewsletterWithdrawalService, type ConsentRepositoryPort, type SubscriberPort } from '@anarchitects/newsletter-nest/application';
    import type { NewsletterConsentPolicy } from '@anarchitects/newsletter-ts/models';
    import { NewsletterSubscriptionRequestSchema } from '@anarchitects/newsletter-ts/dtos';
    import type { NewsletterSubscriptionResponseDTO } from '@anarchitects/newsletter-ts';
    import { NewsletterConsentEntity, TypeOrmConsentRepository, CreateNewsletterConsentEvents1791244800000 } from '@anarchitects/newsletter-nest/infrastructure-persistence';
    import type { DataSource } from 'typeorm';
    import { MailerLiteSubscriberAdapter, MailerLiteWebhookAdapter } from '@anarchitects/newsletter-nest/infrastructure-mailerlite';
    const mailerLite: SubscriberPort = new MailerLiteSubscriberAdapter({apiKey:'test-key',groupId:'123'});
    const webhook = new MailerLiteWebhookAdapter({webhookSecret:'test-secret',accountId:'123'}, {process:async()=>({recorded:0,duplicates:0})});
    void [mailerLite, webhook];
    import {NativeSubscriberAdapter, CryptoNativeToken, NewsletterNativeMailService, NativeUnsubscribeService} from '@anarchitects/newsletter-nest/infrastructure-native';
    import {NewsletterNativeLifecycleService} from '@anarchitects/newsletter-nest/application';
    import {TypeOrmNativeSubscriberRepository, NewsletterNativeSubscriberEntity, NewsletterNativeTokenEntity, CreateNewsletterNativeSubscribers1791288000000} from '@anarchitects/newsletter-nest/infrastructure-persistence';
    declare const dataSource: DataSource;
    const native = new NewsletterNativeLifecycleService(new TypeOrmNativeSubscriberRepository(dataSource),new CryptoNativeToken(),{scope:'host'});
    import {NoopMailerAdapter} from '@anarchitects/common-nest-mailer';
    const mail = new NewsletterNativeMailService(new NoopMailerAdapter(), {publicationName:'Host news',confirmationUrl:'https://host.example.test/confirm',unsubscribeUrl:'https://host.example.test/unsubscribe'});
    const nativeAdapter: SubscriberPort = new NativeSubscriberAdapter(native,mail);
    new NativeUnsubscribeService(native,mail);
    void [nativeAdapter, NewsletterNativeSubscriberEntity, NewsletterNativeTokenEntity, CreateNewsletterNativeSubscribers1791288000000];
    const adapter: ConsentRepositoryPort = new TypeOrmConsentRepository(dataSource);
    void [adapter, NewsletterConsentEntity, CreateNewsletterConsentEvents1791244800000];
    const policy: NewsletterConsentPolicy = {version:'v1',text:'Wording'};
    const repository: ConsentRepositoryPort = { appendGrant: async () => {}, appendWithdrawalOnce: async () => 'recorded' };
    const subscriber: SubscriberPort = { subscribe: async () => {} };
    const response: Promise<NewsletterSubscriptionResponseDTO> = new NewsletterSubscriptionService(repository, subscriber, policy).subscribe({email:'reader@example.test',consent:true,consentVersion:'v1'});
    new NewsletterWithdrawalService(repository).process([]);
    void NewsletterSubscriptionRequestSchema;
    void response;
    const options: NewsletterModuleOptions = {consent:policy,persistence:{mode:'custom',provider:{useValue:repository}},subscriber:{mode:'custom',provider:{useValue:subscriber}},rateLimit:{mode:'disabled'}};
    NewsletterModule.forRoot(options);
    NewsletterModule.forRootFromConfig(options);
    const nativeOptions: NewsletterModuleOptions = {
      consent: policy,
      persistence: {mode:'typeorm',dataSourceToken:'host-data-source'},
      subscriber: {mode:'native',options:{scope:'host'},mail:{publicationName:'Host news',confirmationUrl:'https://host.example.test/confirm',unsubscribeUrl:'https://host.example.test/unsubscribe'}},
      mailer: {useValue:new NoopMailerAdapter()},
      rateLimit:{mode:'disabled'},
    };
    NewsletterModule.forRoot(nativeOptions);
    import {NATIVE_NEWSLETTER_ACTIONS, type NewsletterNativeActionsPort} from '@anarchitects/newsletter-nest/application';
    import type {NewsletterNativeActionRequestDTO,NewsletterNativeActionResponseDTO} from '@anarchitects/newsletter-ts/dtos';
    const action:NewsletterNativeActionRequestDTO={token:'opaque'};
    const accepted:NewsletterNativeActionResponseDTO={accepted:true};
    declare const actions:NewsletterNativeActionsPort;
    void [NATIVE_NEWSLETTER_ACTIONS,actions.confirm(action.token),accepted];

  `;
  const consumers = ['cts', 'mts'].map((extension) => {
    const filename = path.join(temp, `consumer.${extension}`);
    writeFileSync(filename, source);
    return filename;
  });
  const program = ts.createProgram(consumers, {
    noEmit: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.Node16,
    moduleResolution: ts.ModuleResolutionKind.Node16,
    types: ['node'],
    typeRoots: [path.join(temp, 'node_modules/@types')],
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(
    diagnostics.length,
    0,
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: () => temp,
      getCanonicalFileName: (name) => name,
      getNewLine: () => '\n',
    }),
  );
  const requireConsumer = createRequire(consumers[0]);
  const facade = requireConsumer('@anarchitects/newsletter-nest');
  assert.equal(typeof facade.NewsletterModule.forRoot, 'function');
  assert.equal(
    typeof requireConsumer('@anarchitects/newsletter-nest/config')
      .newsletterConfig,
    'function',
  );
  assert.equal(
    typeof requireConsumer('@anarchitects/newsletter-nest/presentation')
      .NewsletterPresentationModule,
    'function',
  );
  const api = requireConsumer('@anarchitects/newsletter-nest/application');
  const mailerLite = requireConsumer(
    '@anarchitects/newsletter-nest/infrastructure-mailerlite',
  );
  assert.equal(typeof mailerLite.MailerLiteSubscriberAdapter, 'function');
  assert.equal(typeof mailerLite.MailerLiteWebhookAdapter, 'function');
  assert.equal(mailerLite.MAILERLITE_SIGNATURE_HEADER, 'signature');
  const persistence = requireConsumer(
    '@anarchitects/newsletter-nest/infrastructure-persistence',
  );
  assert.equal(typeof persistence.NewsletterConsentEntity, 'function');
  assert.equal(typeof persistence.TypeOrmConsentRepository, 'function');
  assert.equal(
    typeof persistence.CreateNewsletterConsentEvents1791244800000,
    'function',
  );
  const order = [];
  const repository = {
    appendGrant: async () => {
      order.push('grant');
    },
    appendWithdrawalOnce: async () => 'recorded',
  };
  const subscriber = {
    subscribe: async () => {
      order.push('provider');
    },
  };
  assert.deepEqual(
    await new api.NewsletterSubscriptionService(repository, subscriber, {
      version: 'v1',
      text: 'Wording',
    }).subscribe({
      email: 'reader@example.test',
      consent: true,
      consentVersion: 'v1',
    }),
    { accepted: true },
  );
  assert.deepEqual(order, ['grant', 'provider']);
  assert.deepEqual(
    await new api.NewsletterWithdrawalService(repository).process([
      { email: 'reader@example.test', eventSource: 'account', dedupeKey: '1' },
    ]),
    { recorded: 1, duplicates: 0 },
  );
  const { CommonMailerModule, MailerPort } = requireConsumer(
    '@anarchitects/common-nest-mailer',
  );
  const { Test } = requireConsumer('@nestjs/testing');
  const { Module } = requireConsumer('@nestjs/common');
  class HostDatabase {}
  Module({
    providers: [
      { provide: 'host-database', useValue: { options: { type: 'postgres' } } },
    ],
    exports: ['host-database'],
  })(HostDatabase);
  const moduleRef = await Test.createTestingModule({
    imports: [
      facade.NewsletterModule.forRoot({
        imports: [
          HostDatabase,
          CommonMailerModule.forRoot({ provider: 'noop' }),
        ],
        consent: { version: 'v1', text: 'Host wording' },
        persistence: { mode: 'typeorm', dataSourceToken: 'host-database' },
        subscriber: {
          mode: 'native',
          options: { scope: 'host' },
          mail: {
            publicationName: 'Host news',
            confirmationUrl: 'https://host.example.test/confirm',
            unsubscribeUrl: 'https://host.example.test/unsubscribe',
          },
        },
        mailer: { useExisting: MailerPort },
        rateLimit: { mode: 'disabled' },
      }),
    ],
  }).compile();
  try {
    const actions = moduleRef.get(api.NATIVE_NEWSLETTER_ACTIONS);
    await actions.confirm('invalid');
    await actions.unsubscribe('invalid');
    const { NewsletterNativeMailService } = requireConsumer(
      '@anarchitects/newsletter-nest/infrastructure-native',
    );
    const mail = new NewsletterNativeMailService(moduleRef.get(MailerPort), {
      publicationName: 'Host news',
      confirmationUrl: 'https://host.example.test/confirm',
      unsubscribeUrl: 'https://host.example.test/unsubscribe',
    });
    await mail.sendUnsubscribed('reader@example.test');
  } finally {
    await moduleRef.close();
  }
  // Optional TypeORM must not be needed just to load/use the facade with custom ports.
  rmSync(path.join(temp, 'node_modules/typeorm'));
  rmSync(path.join(temp, 'node_modules/@anarchitects/common-nest-mailer'), {
    recursive: true,
  });
  const { spawnSync } = await import('node:child_process');
  const optional = spawnSync(
    process.execPath,
    [
      '-e',
      `
    const {CryptoNativeToken,NativeSubscriberAdapter} = require('@anarchitects/newsletter-nest/infrastructure-native');
    const token = new CryptoNativeToken().issue('confirm');
    if (!token.hash || !NativeSubscriberAdapter) throw new Error('Missing native export');
    const { NewsletterModule } = require('@anarchitects/newsletter-nest');
    NewsletterModule.forRoot({consent:{version:'v1',text:'wording'},persistence:{mode:'custom',provider:{useValue:{appendGrant:async()=>{},appendWithdrawalOnce:async()=> 'recorded'}}},subscriber:{mode:'noop'},rateLimit:{mode:'disabled'}});
  `,
    ],
    { cwd: temp, encoding: 'utf8' },
  );
  assert.equal(optional.status, 0, optional.stderr);
  const esm = await import(
    pathToFileURL(
      path.join(
        temp,
        'node_modules/@anarchitects/newsletter-nest/src/application/index.js',
      ),
    ).href
  );
  assert.equal(typeof esm.NewsletterSubscriptionService, 'function');
  const schemas = await import(
    pathToFileURL(
      path.join(temp, 'node_modules/@anarchitects/newsletter-ts/dtos/index.js'),
    ).href
  );
  assert.equal(schemas.NewsletterSubscriptionRequestSchema.type, 'object');
  console.log(
    'Package smoke passed: CJS/ESM runtime, Node16 declarations and application services.',
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}
