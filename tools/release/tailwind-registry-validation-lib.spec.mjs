import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TAILWIND_PACKAGE,
  TAILWIND_PROVENANCE_PREDICATE,
  fetchRegistryPackument,
  validateRetiredPackageRegistryMetadata,
  validateTailwindRegistryMetadata,
  waitForPublishedVersion,
} from './tailwind-registry-validation-lib.mjs';

function createTailwindPackument(version = '0.0.1') {
  return {
    name: TAILWIND_PACKAGE,
    versions: {
      [version]: {
        name: TAILWIND_PACKAGE,
        version,
        style: './index.css',
        exports: {
          '.': './index.css',
          './theme.css': './theme.css',
          './base.css': './base.css',
          './utilities.css': './utilities.css',
          './package.json': './package.json',
        },
        peerDependencies: { tailwindcss: '^4.0.0' },
        publishConfig: { access: 'public' },
        dist: {
          tarball:
            'https://registry.npmjs.org/@anarchitects/tailwind/-/tailwind-0.0.1.tgz',
          integrity: 'sha512-example',
          shasum: '0123456789abcdef0123456789abcdef01234567',
          signatures: [{ keyid: 'key', sig: 'signature' }],
          attestations: {
            url: 'https://registry.npmjs.org/-/npm/v1/attestations/package',
            provenance: { predicateType: TAILWIND_PROVENANCE_PREDICATE },
          },
        },
      },
    },
  };
}

test('encodes the complete scoped package name in registry requests', async (t) => {
  const originalFetch = globalThis.fetch;
  let requestedUrl;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (url) => {
    requestedUrl = url;
    return {
      ok: true,
      json: async () => ({ name: TAILWIND_PACKAGE }),
    };
  };

  await fetchRegistryPackument(TAILWIND_PACKAGE);

  assert.equal(
    requestedUrl,
    'https://registry.npmjs.org/%40anarchitects%2Ftailwind',
  );
});

test('validates the initial Tailwind registry contract and provenance', () => {
  const metadata = validateTailwindRegistryMetadata(
    createTailwindPackument(),
    '0.0.1',
  );

  assert.equal(metadata.version, '0.0.1');
});

test('rejects a Tailwind release without Trusted Publisher provenance', () => {
  const packument = createTailwindPackument();
  delete packument.versions['0.0.1'].dist.attestations;

  assert.throws(
    () => validateTailwindRegistryMetadata(packument, '0.0.1'),
    /Trusted Publisher provenance/,
  );
});

test('requires retired Common Angular versions to remain downloadable', () => {
  const packageName = '@anarchitects/common-angular-design';
  assert.deepEqual(
    validateRetiredPackageRegistryMetadata(packageName, {
      name: packageName,
      versions: {
        '0.1.0': {},
        '0.1.1': { deprecated: 'Use @anarchitects/tailwind' },
      },
    }),
    ['0.1.0', '0.1.1'],
  );

  assert.throws(
    () =>
      validateRetiredPackageRegistryMetadata(packageName, {
        name: packageName,
        versions: {},
      }),
    /must remain downloadable/,
  );
});

test('waits for the selected version to become visible', async () => {
  let attempts = 0;
  const packument = createTailwindPackument();
  const result = await waitForPublishedVersion({
    packageName: TAILWIND_PACKAGE,
    version: '0.0.1',
    attempts: 2,
    delayMs: 0,
    sleep: async () => undefined,
    loadPackument: async () => {
      attempts += 1;
      return attempts === 1
        ? { name: TAILWIND_PACKAGE, versions: {} }
        : packument;
    },
  });

  assert.equal(result, packument);
  assert.equal(attempts, 2);
});

test('waits for provenance metadata to become visible', async () => {
  let attempts = 0;
  const incomplete = createTailwindPackument();
  delete incomplete.versions['0.0.1'].dist.attestations;
  const complete = createTailwindPackument();

  const result = await waitForPublishedVersion({
    packageName: TAILWIND_PACKAGE,
    version: '0.0.1',
    attempts: 2,
    delayMs: 0,
    sleep: async () => undefined,
    loadPackument: async () => {
      attempts += 1;
      return attempts === 1 ? incomplete : complete;
    },
    validatePackument: (packument) =>
      validateTailwindRegistryMetadata(packument, '0.0.1'),
  });

  assert.equal(result, complete);
  assert.equal(attempts, 2);
});
