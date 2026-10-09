import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '../..');
const readJson = (file) =>
  JSON.parse(readFileSync(resolve(root, file), 'utf8'));

for (const major of ['11', '12']) {
  test(`Nest ${major} host is locked, aligned and independent of workspace tooling`, () => {
    const fixture = `tools/testing/nest-hosts/${major}`;
    const manifest = readJson(`${fixture}/package.json.template`);
    const lock = readJson(`${fixture}/package-lock.json.template`);
    assert.equal(manifest.private, true);
    assert.equal(lock.lockfileVersion, 3);
    assert.deepEqual(lock.packages[''].dependencies, manifest.dependencies);
    assert.deepEqual(
      lock.packages[''].devDependencies,
      manifest.devDependencies,
    );
    for (const [name, version] of Object.entries({
      ...manifest.dependencies,
      ...manifest.devDependencies,
    })) {
      assert.match(
        version,
        /^\d+\.\d+\.\d+$/,
        `${name} must use an exact version`,
      );
      assert.equal(lock.packages[`node_modules/${name}`].version, version);
    }
    const frameworkVersion = manifest.dependencies['@nestjs/core'];
    assert.ok(frameworkVersion.startsWith(`${major}.`));
    for (const name of ['common', 'testing', 'platform-fastify']) {
      assert.equal(manifest.dependencies[`@nestjs/${name}`], frameworkVersion);
    }
    for (const [name, entry] of Object.entries(lock.packages)) {
      assert.ok(
        !entry.link,
        `Host must not link a workspace dependency: ${name}`,
      );
      assert.doesNotMatch(name, /node_modules\/(?:nx$|@nx\/|@anarchitects\/)/);
      if (name) {
        assert.match(entry.resolved, /^https:\/\/registry\.npmjs\.org\//);
        assert.ok(entry.integrity, `Missing artifact integrity: ${name}`);
      }
    }
  });
}

test('host runner rejects unsupported or extra arguments before installing', () => {
  for (const args of [[], ['13'], ['12', '--unexpected']]) {
    const result = spawnSync(
      process.execPath,
      [resolve(root, 'tools/testing/run-nest-development-host.mjs'), ...args],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Expected exactly one Nest major: 11 or 12/);
    assert.equal(result.stdout, '');
  }
});
