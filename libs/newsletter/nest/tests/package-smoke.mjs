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
  for (const dependency of ['@sinclair', '@types', 'tslib', 'typeorm']) {
    symlinkSync(
      path.join(root, 'node_modules', dependency),
      path.join(temp, 'node_modules', dependency),
      'junction',
    );
  }
  const source = `
    import { NewsletterSubscriptionService, NewsletterWithdrawalService, type ConsentRepositoryPort, type SubscriberPort } from '@anarchitects/newsletter-nest/application';
    import type { NewsletterConsentPolicy } from '@anarchitects/newsletter-ts/models';
    import { NewsletterSubscriptionRequestSchema } from '@anarchitects/newsletter-ts/dtos';
    import type { NewsletterSubscriptionResponseDTO } from '@anarchitects/newsletter-ts';
    import { NewsletterConsentEntity, TypeOrmConsentRepository, CreateNewsletterConsentEvents1791244800000 } from '@anarchitects/newsletter-nest/infrastructure-persistence';
    import type { DataSource } from 'typeorm';
    declare const dataSource: DataSource;
    const adapter: ConsentRepositoryPort = new TypeOrmConsentRepository(dataSource);
    void [adapter, NewsletterConsentEntity, CreateNewsletterConsentEvents1791244800000];
    const policy: NewsletterConsentPolicy = {version:'v1',text:'Wording'};
    const repository: ConsentRepositoryPort = { appendGrant: async () => {}, appendWithdrawalOnce: async () => 'recorded' };
    const subscriber: SubscriberPort = { subscribe: async () => {} };
    const response: Promise<NewsletterSubscriptionResponseDTO> = new NewsletterSubscriptionService(repository, subscriber, policy).subscribe({email:'reader@example.test',consent:true,consentVersion:'v1'});
    new NewsletterWithdrawalService(repository).process([]);
    void NewsletterSubscriptionRequestSchema;
    void response;
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
  const api = requireConsumer('@anarchitects/newsletter-nest/application');
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
