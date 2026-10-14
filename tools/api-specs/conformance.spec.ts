import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  loadCanonicalArtifacts,
  compareOperationInventory,
  expand,
} from './canonical-artifacts.mjs';
import {
  implementationChanges,
  assertCompatibilityReview,
} from './compatibility.mjs';
import {
  canonicalOperations,
  resolveOperationId,
  resolveTags,
  isManagedOpenApiPath,
} from './route-metadata';

const artifacts = loadCanonicalArtifacts();
const document = JSON.parse(readFileSync('docs/openapi/openapi.json', 'utf8'));
test('published inventories cover protected operations excluded from OpenAPI paths', () => {
  const forms = artifacts.find(({ domain }) => domain === 'forms');
  assert.ok(forms);
  assert.equal(Object.keys(forms.document.paths).length, 0);
  assert.equal(forms.inventory.operations.length, 4);
  assert.equal(canonicalOperations.length, 29);
  assert.deepEqual(compareOperationInventory(document, artifacts), []);
});
test('metadata resolves exclusively from canonical operations, with segment boundaries', () => {
  for (const operation of canonicalOperations) {
    assert.equal(
      resolveOperationId(operation.method, operation.path),
      operation.operationId,
    );
    assert.deepEqual(resolveTags(operation.method, operation.path), [
      ...operation.tags,
    ]);
  }
  assert.throws(() => resolveOperationId('GET', '/auth/not-published'));
  assert.equal(isManagedOpenApiPath('/authentication'), false);
  assert.equal(isManagedOpenApiPath('/auth/unknown'), true);
});
test('route removal, renamed ids, tags and success statuses cannot pass the inventory gate', () => {
  for (const change of [
    (doc) => delete doc.paths['/auth/jwt/login'],
    (doc) => (doc.paths['/auth/login'].post.operationId = 'localLogin'),
    (doc) => (doc.paths['/identity/profiles'].post.tags = ['Local']),
    (doc) => delete doc.paths['/forms/submit'].post.responses['200'],
  ]) {
    const altered = structuredClone(document);
    change(altered);
    assert.ok(compareOperationInventory(altered, artifacts).length);
  }
});
test('comparison preserves OpenAPI 3.1 null types and rejects unresolved references', () => {
  assert.deepEqual(expand({ type: ['string', 'null'] }, {}), {
    type: ['string', 'null'],
  });
  assert.throws(() =>
    expand({ $ref: '#/components/schemas/missing' }, document),
  );
  assert.throws(() =>
    expand({ $ref: 'https://example.test/mutable' }, document),
  );
});
test('constraint, response, header and security mutations require explicit review', () => {
  for (const change of [
    (doc) =>
      (doc.paths['/auth/login'].post.requestBody.content[
        'application/json'
      ].schema.properties.password.minLength = 99),
    (doc) =>
      (doc.paths['/auth/login'].post.responses['200'] = {
        description: 'empty',
      }),
    (doc) =>
      (doc.paths['/auth/login'].post.responses['200'].headers = {
        'set-cookie': { schema: { type: 'string' } },
      }),
    (doc) =>
      (doc.paths['/identity/profiles'].post.security = [{ session: [] }]),
  ]) {
    const altered = structuredClone(document);
    change(altered);
    assert.ok(
      implementationChanges(document, altered, artifacts).some(
        ({ impact }) => impact === 'review-required',
      ),
    );
  }
});
test('annotation changes are not wire changes and local new routes cannot self-authorize', () => {
  const prose = structuredClone(document);
  prose.paths['/auth/login'].post.responses['200'].description =
    'Updated prose';
  assert.deepEqual(implementationChanges(document, prose, artifacts), []);
  const extra = structuredClone(document);
  extra.paths['/auth/local-only'] = {
    post: { operationId: 'localOnly', tags: ['Auth'] },
  };
  assert.throws(() => implementationChanges(document, extra, artifacts));
});

test('schema properties named description or title are never treated as prose', () => {
  assert.deepEqual(
    expand(
      {
        type: 'object',
        properties: {
          description: { type: 'string', minLength: 2 },
          title: { type: 'integer' },
        },
      },
      {},
    ),
    {
      type: 'object',
      properties: {
        description: { type: 'string', minLength: 2 },
        title: { type: 'integer' },
      },
    },
  );
});

test('missing, stale and incomplete compatibility reviews fail closed', () => {
  const approved = {
    status: 'approved',
    fingerprint: 'exact-comparison',
    owner: 'fixture-reviewer',
    decision: 'https://github.com/anarchitects/example/issues/1',
    migration: 'fixture migration',
    rollback: 'fixture rollback',
  };
  assert.doesNotThrow(() =>
    assertCompatibilityReview(approved, 'exact-comparison'),
  );
  for (const review of [
    undefined,
    { ...approved, status: 'draft' },
    { ...approved, fingerprint: 'stale' },
    { ...approved, owner: '' },
    { ...approved, migration: {} },
    { ...approved, rollback: '' },
  ])
    assert.throws(() => assertCompatibilityReview(review, 'exact-comparison'));
});
