import assert from 'node:assert/strict';
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import semver from 'semver';
import {
  planHostFixtureVersions,
  readHostPackageManifests,
} from './host-fixture-versions.mjs';

const workspace = resolve(import.meta.dirname, '../..');
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'release-host-fixtures-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'tools/testing'), { recursive: true });
  for (const family of ['auth', 'forms-identity', 'newsletter']) {
    cpSync(
      join(workspace, `tools/testing/${family}-nest-hosts`),
      join(root, `tools/testing/${family}-nest-hosts`),
      { recursive: true },
    );
  }
  const before = readHostPackageManifests(workspace);
  return { root, before, after: structuredClone(before) };
}

function bumpDomain(manifests, domain) {
  const versions = new Map();
  for (const [root, manifest] of Object.entries(manifests)) {
    if (root.startsWith(`libs/${domain}/`)) {
      manifest.version = semver.inc(manifest.version, 'minor');
      versions.set(manifest.name, manifest.version);
    }
  }
  for (const manifest of Object.values(manifests)) {
    for (const field of [
      'dependencies',
      'optionalDependencies',
      'peerDependencies',
    ]) {
      for (const [name, range] of Object.entries(manifest[field] ?? {})) {
        if (versions.has(name))
          manifest[field][name] =
            `${range.startsWith('^') ? '^' : ''}${versions.get(name)}`;
      }
    }
  }
}

test('Auth release updates candidate versions and internal ranges without registry drift', (t) => {
  const { root, before, after } = fixture(t);
  bumpDomain(after, 'auth');
  const changes = planHostFixtureVersions(root, before, after);
  assert.equal(changes.length, 4);
  for (const { path, content } of changes) {
    assert.ok(path.includes('/auth-nest-hosts/'));
    if (path.endsWith('package-lock.json.template')) {
      const oldLock = JSON.parse(readFileSync(path, 'utf8'));
      const nextLock = JSON.parse(content);
      assert.deepEqual(
        Object.keys(nextLock.packages),
        Object.keys(oldLock.packages),
      );
      for (const [name, entry] of Object.entries(nextLock.packages)) {
        if (
          ['auth-ts', 'auth-nest', 'auth-declarations'].some(
            (pkg) => name === `node_modules/@anarchitects/${pkg}`,
          )
        ) {
          assert.equal(entry.version, after['libs/auth/ts'].version);
          assert.equal(entry.integrity, undefined);
          assert.match(entry.resolved, /^file:/);
        } else assert.deepEqual(entry, oldLock.packages[name]);
      }
      assert.equal(
        nextLock.packages['node_modules/@anarchitects/auth-declarations']
          .dependencies['@anarchitects/auth-ts'],
        `^${after['libs/auth/ts'].version}`,
      );
    }
    writeFileSync(path, content);
  }
  assert.deepEqual(planHostFixtureVersions(root, after, after), []);
});

test('Forms and Newsletter releases also keep their full and optional hosts aligned', (t) => {
  const { root, before, after } = fixture(t);
  bumpDomain(after, 'forms');
  bumpDomain(after, 'newsletter');
  const changes = planHostFixtureVersions(root, before, after);
  assert.equal(changes.length, 10);
  for (const { path, content } of changes) {
    if (path.includes('-optional/')) {
      assert.equal(
        JSON.parse(content).packages[
          'node_modules/@anarchitects/common-nest-mailer'
        ],
        undefined,
      );
    }
    writeFileSync(path, content);
  }
  assert.deepEqual(planHostFixtureVersions(root, after, after), []);
});

test('shared Mailer versioning updates internal peers across every host family', (t) => {
  const { root, before, after } = fixture(t);
  bumpDomain(after, 'common');
  const changes = planHostFixtureVersions(root, before, after);
  assert.equal(changes.length, 14);
  for (const { path, content } of changes) writeFileSync(path, content);
  assert.deepEqual(planHostFixtureVersions(root, after, after), []);
});

test('release cannot hide external dependency, peer, engine or stale-lock changes', (t) => {
  const { root, before, after } = fixture(t);
  after['libs/auth/nest'].dependencies['better-auth'] = '99.0.0';
  assert.throws(
    () => planHostFixtureVersions(root, before, after),
    /external dependency better-auth/,
  );
  for (const [field, value] of [
    [
      'peerDependencies',
      { ...before['libs/auth/nest'].peerDependencies, '@nestjs/common': '*' },
    ],
    ['engines', { node: '*' }],
  ]) {
    const changed = structuredClone(before);
    changed['libs/auth/nest'][field] = value;
    assert.throws(
      () => planHostFixtureVersions(root, before, changed),
      /external dependency|package metadata/,
    );
  }
  const path = join(
    root,
    'tools/testing/auth-nest-hosts/nest11/package-lock.json.template',
  );
  const lock = JSON.parse(readFileSync(path, 'utf8'));
  lock.packages['node_modules/@anarchitects/auth-declarations'].dependencies[
    '@anarchitects/auth-ts'
  ] = '^0.1.0';
  writeFileSync(path, JSON.stringify(lock));
  assert.throws(
    () => planHostFixtureVersions(root, before, before),
    /refresh lock dependencies/,
  );
});

test('release rejects unsatisfied internal ranges instead of rewriting packed contracts', (t) => {
  const { root, before, after } = fixture(t);
  after['libs/auth/declarations'].dependencies['@anarchitects/auth-ts'] =
    '^99.0.0';
  assert.throws(
    () => planHostFixtureVersions(root, before, after),
    /candidate does not satisfy/,
  );
});

test('planning is deterministic, read-only and retains reviewed future candidates', (t) => {
  const { root, before, after } = fixture(t);
  const path = join(root, 'tools/testing/auth-nest-hosts/candidates.json');
  const candidates = JSON.parse(readFileSync(path, 'utf8'));
  const candidate = candidates.find((entry) => entry.root === 'libs/auth/ts');
  candidate.version = semver.inc(candidate.version, 'patch');
  writeFileSync(path, JSON.stringify(candidates));
  for (const host of ['nest11', 'nest11-modern', 'nest12']) {
    const lockPath = join(
      root,
      `tools/testing/auth-nest-hosts/${host}/package-lock.json.template`,
    );
    const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
    lock.packages['node_modules/@anarchitects/auth-ts'].version =
      candidate.version;
    writeFileSync(lockPath, JSON.stringify(lock));
  }
  assert.deepEqual(planHostFixtureVersions(root, before, before), []);
  bumpDomain(after, 'auth');
  const first = planHostFixtureVersions(root, before, after);
  assert.deepEqual(planHostFixtureVersions(root, before, after), first);
  assert.equal(
    JSON.parse(readFileSync(path, 'utf8')).find(
      (entry) => entry.root === 'libs/auth/ts',
    ).version,
    candidate.version,
  );
});
