import assert from 'node:assert/strict';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

// Built ESM package and declarations in a consumer without workspace aliases.
const root = process.cwd();
const temp = mkdtempSync(path.join(tmpdir(), 'newsletter-angular-package-'));
try {
  mkdirSync(path.join(temp, 'node_modules/@anarchitects'), { recursive: true });
  for (const layer of ['angular', 'ts'])
    cpSync(
      path.join(root, 'dist/libs/newsletter', layer),
      path.join(temp, 'node_modules/@anarchitects/newsletter-' + layer),
      { recursive: true },
    );
  for (const name of ['@angular', '@sinclair', 'rxjs', 'tslib'])
    symlinkSync(
      path.join(root, 'node_modules', name),
      path.join(temp, 'node_modules', name),
      'junction',
    );
  const consumer = path.join(temp, 'consumer.mts');
  writeFileSync(
    consumer,
    `
    import { provideNewsletter, NewsletterStore, type NewsletterConfig } from '@anarchitects/newsletter-angular';
    import { provideNewsletterConfig, NEWSLETTER_CONFIG } from '@anarchitects/newsletter-angular/config';
    import { NewsletterApi, NewsletterApiError, provideNewsletterDataAccess } from '@anarchitects/newsletter-angular/data-access';
    import { provideNewsletterState, type NewsletterSubmissionState } from '@anarchitects/newsletter-angular/state';
    import type { NewsletterSubscriptionRequestDTO } from '@anarchitects/newsletter-ts/dtos';
    const config: NewsletterConfig = {consent:{version:'v1',text:'Host wording'},apiBaseUrl:'/api'};
    const providers = [...provideNewsletter(config),...provideNewsletterConfig(config),...provideNewsletterDataAccess(),...provideNewsletterState()];
    declare const store: NewsletterStore;
    const request: NewsletterSubscriptionRequestDTO = {email:'reader@example.test',consent:true,consentVersion:store.consent.version};
    const state: NewsletterSubmissionState = store.state();
    store.submit(request);store.reset();
    void [providers, state, NewsletterApi, NewsletterApiError, NEWSLETTER_CONFIG];
  `,
  );
  const program = ts.createProgram([consumer], {
    noEmit: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    types: [],
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
  writeFileSync(
    path.join(temp, 'consumer.mjs'),
    `
    import '@angular/compiler';
    import assert from 'node:assert/strict';
    import {createEnvironmentInjector} from '@angular/core';
    import {of} from 'rxjs';
    import {provideNewsletter, NewsletterStore} from '@anarchitects/newsletter-angular';
    import {NewsletterApi} from '@anarchitects/newsletter-angular/data-access';
    import {NEWSLETTER_CONFIG} from '@anarchitects/newsletter-angular/config';
    let calls=0;
    const injector=createEnvironmentInjector([
      ...provideNewsletter({consent:{version:'v1',text:'Host wording'},apiBaseUrl:'/api'}),
      {provide:NewsletterApi,useValue:{subscribe:()=>{calls++;return of({accepted:true});}}},
    ]);
    try {
      const store=injector.get(NewsletterStore);
      assert.equal(calls,0);
      assert.equal(injector.get(NEWSLETTER_CONFIG).subscriptionUrl,'/api/newsletter/subscribe');
      assert.deepEqual(await store.submit({email:'reader@example.test',consent:true,consentVersion:'v1'}),{accepted:true});
      assert.deepEqual(store.state(),{status:'success'});
      assert.equal(calls,1);
      store.reset();assert.equal(store.status(),'idle');
    } finally {injector.destroy();}
  `,
  );
  const runtime = spawnSync(
    process.execPath,
    [path.join(temp, 'consumer.mjs')],
    { cwd: temp, encoding: 'utf8' },
  );
  assert.equal(runtime.status, 0, runtime.stderr);
  console.log(
    'Package smoke passed: ESM exports, strict consumer declarations and scoped state without browser globals.',
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}
