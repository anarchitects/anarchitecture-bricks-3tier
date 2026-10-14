import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertBreakingVersion,
  validateCanonicalReleaseVersions,
} from './canonical-compatibility.mjs';

test('actual pre-1.0 breaking version must advance the minor, irrespective of commit type or override', () => {
  for (const proposed of [null, '0.11.0', '0.11.1', '0.12.0-beta.0'])
    assert.throws(() =>
      assertBreakingVersion('forms-nest', '0.11.0', proposed),
    );
  assert.doesNotThrow(() =>
    assertBreakingVersion('forms-nest', '0.11.0', '0.12.0'),
  );
  assert.throws(() => assertBreakingVersion('forms-nest', '1.2.3', '1.3.0'));
  assert.doesNotThrow(() =>
    assertBreakingVersion('forms-nest', '1.2.3', '2.0.0'),
  );
});
const doc = {
  paths: {
    '/forms/submit': {
      post: {
        operationId: 'submitForm',
        responses: {
          200: {
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
  },
};
const root = { dependencies: { '@anarchitects/forms-contracts': '0.1.0' } };
test('adoption and changed wire descriptions are evaluated against each package release tag', () => {
  const reads = [];
  const options = {
    rootPackage: root,
    implementation: doc,
    readAt: (tag, path) => {
      reads.push(tag);
      return path === 'package.json' ? { dependencies: {} } : doc;
    },
  };
  assert.throws(() =>
    validateCanonicalReleaseVersions(
      { 'forms-nest': { currentVersion: '0.11.0', newVersion: '0.11.1' } },
      options,
    ),
  );
  assert.doesNotThrow(() =>
    validateCanonicalReleaseVersions(
      { 'forms-nest': { currentVersion: '0.11.0', newVersion: '0.12.0' } },
      options,
    ),
  );
  assert.deepEqual([...new Set(reads)], ['forms-nest@0.11.0']);
});
test('unchanged contract and implementation permit an independent patch', () => {
  validateCanonicalReleaseVersions(
    { 'forms-nest': { currentVersion: '0.12.0', newVersion: '0.12.1' } },
    {
      rootPackage: root,
      implementation: doc,
      readAt: (_tag, path) => (path === 'package.json' ? root : doc),
    },
  );
});
test('missing published history never becomes a successful compatibility check', () => {
  assert.throws(
    () =>
      validateCanonicalReleaseVersions(
        { 'forms-nest': { currentVersion: '0.11.0', newVersion: '0.12.0' } },
        {
          firstRelease: true,
          rootPackage: root,
          implementation: doc,
          readAt: () => {
            throw new Error('missing tag');
          },
        },
      ),
    /missing tag/,
  );
});

import { validateCommitScope } from './commit-scope-lib.mjs';
test('commit scopes use exact Nx projects, not domains or release groups', () => {
  const projects = new Set([
    'api-specs',
    'release-tools',
    'newsletter-nest-example',
  ]);
  const types = new Set(['fix', 'feat', 'ci']);
  assert.equal(
    validateCommitScope('fix(newsletter): fix CI', projects, types),
    'Scope "newsletter" is not an exact Nx project name',
  );
  assert.equal(
    validateCommitScope(
      'ci(api-specs): enforce canonical evidence',
      projects,
      types,
    ),
    null,
  );
  assert.equal(
    validateCommitScope(
      'fix(newsletter-nest-example): restore test fixture',
      projects,
      types,
    ),
    null,
  );
  assert.ok(validateCommitScope('unknown(api-specs): change', projects, types));
  assert.equal(
    validateCommitScope('ci: update shared workflow', projects, types),
    null,
  );
});
