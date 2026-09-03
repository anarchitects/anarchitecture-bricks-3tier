import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TAILWIND_PACKAGE,
  TAILWIND_PROVENANCE_PREDICATE,
  validateLegacyPackageRegistryMetadata,
  validateTailwindRegistryMetadata,
  waitForPublishedVersion,
} from './tailwind-registry-validation-lib.mjs';

function createTailwindPackument(version = '0.1.0') {
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
            'https://registry.npmjs.org/@anarchitects/tailwind/-/tailwind-0.1.0.tgz',
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

test('validates the initial Tailwind registry contract and provenance', () => {
  const metadata = validateTailwindRegistryMetadata(
    createTailwindPackument(),
    '0.1.0',
  );

  assert.equal(metadata.version, '0.1.0');
});

test('rejects a Tailwind release without Trusted Publisher provenance', () => {
  const packument = createTailwindPackument();
  delete packument.versions['0.1.0'].dist.attestations;

  assert.throws(
    () => validateTailwindRegistryMetadata(packument, '0.1.0'),
    /Trusted Publisher provenance/,
  );
});

test('requires every legacy Common Angular version to remain non-deprecated', () => {
  const packageName = '@anarchitects/common-angular-design';
  assert.deepEqual(
    validateLegacyPackageRegistryMetadata(packageName, {
      name: packageName,
      versions: { '0.1.0': {}, '0.1.1': {} },
    }),
    ['0.1.0', '0.1.1'],
  );

  assert.throws(
    () =>
      validateLegacyPackageRegistryMetadata(packageName, {
        name: packageName,
        versions: { '0.1.0': { deprecated: 'Use another package' } },
      }),
    /must remain non-deprecated/,
  );
});

test('waits for the selected version to become visible', async () => {
  let attempts = 0;
  const packument = createTailwindPackument();
  const result = await waitForPublishedVersion({
    packageName: TAILWIND_PACKAGE,
    version: '0.1.0',
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
  delete incomplete.versions['0.1.0'].dist.attestations;
  const complete = createTailwindPackument();

  const result = await waitForPublishedVersion({
    packageName: TAILWIND_PACKAGE,
    version: '0.1.0',
    attempts: 2,
    delayMs: 0,
    sleep: async () => undefined,
    loadPackument: async () => {
      attempts += 1;
      return attempts === 1 ? incomplete : complete;
    },
    validatePackument: (packument) =>
      validateTailwindRegistryMetadata(packument, '0.1.0'),
  });

  assert.equal(result, complete);
  assert.equal(attempts, 2);
});
