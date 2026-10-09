import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '../..');
const project = 'libs/common/nest/mailer';
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const source = readJson(join(root, project, 'package.json'));

for (const [host, framework, config] of [
  ['nest11', '11.1.6', '4.0.2'],
  ['nest11-config12', '11.1.6', '12.0.1'],
  ['nest12', '12.1.2', '12.0.1'],
]) {
  test(`Common Mailer ${host} locks registry dependencies and the packed contract`, () => {
    const fixture = join(root, project, 'tests/hosts', host);
    const manifest = readJson(join(fixture, 'package.json.template'));
    const lock = readJson(join(fixture, 'package-lock.json.template'));
    assert.equal(manifest.private, true);
    assert.equal(lock.lockfileVersion, 3);
    assert.deepEqual(lock.packages[''].dependencies, manifest.dependencies);
    assert.deepEqual(
      lock.packages[''].devDependencies,
      manifest.devDependencies,
    );
    assert.equal(manifest.dependencies[source.name], 'file:common-mailer.tgz');
    for (const name of ['common', 'core', 'testing']) {
      assert.equal(manifest.dependencies[`@nestjs/${name}`], framework);
    }
    assert.equal(manifest.dependencies['@nestjs/config'], config);
    assert.equal(manifest.dependencies['@nestjs-modules/mailer'], '3.0.2');
    assert.equal(manifest.dependencies.nodemailer, '8.0.5');
    for (const [name, version] of Object.entries({
      ...manifest.dependencies,
      ...manifest.devDependencies,
    })) {
      if (name === source.name) continue;
      assert.match(version, /^\d+\.\d+\.\d+$/);
      assert.equal(lock.packages[`node_modules/${name}`].version, version);
    }
    for (const [name, entry] of Object.entries(lock.packages)) {
      assert.ok(!entry.link, `No workspace links: ${name}`);
      if (!name) continue;
      if (name === `node_modules/${source.name}`) {
        assert.equal(entry.resolved, 'file:common-mailer.tgz');
        assert.equal(entry.integrity, undefined);
        assert.deepEqual(entry.dependencies, source.dependencies);
        assert.deepEqual(entry.peerDependencies, source.peerDependencies);
      } else {
        assert.match(entry.resolved, /^https:\/\/registry\.npmjs\.org\//);
        assert.ok(entry.integrity, `Registry integrity required: ${name}`);
        assert.doesNotMatch(
          name,
          /node_modules\/(?:nx$|@nx\/|@anarchitects\/)/,
        );
      }
    }
  });
}

test('external peer normalization preserves the independently verified Mailer contract', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'mailer-normalization-'));
  try {
    mkdirSync(join(workspace, 'libs/mailer'), { recursive: true });
    mkdirSync(join(workspace, 'libs/control'), { recursive: true });
    writeFileSync(
      join(workspace, 'package.json'),
      JSON.stringify({
        dependencies: {
          '@nestjs/common': '^11.0.0',
          '@nestjs/config': '^4.0.2',
          '@nestjs-modules/mailer': '^2.3.4',
          nodemailer: '^7.0.9',
        },
      }),
    );
    writeFileSync(
      join(workspace, 'libs/mailer/package.json'),
      JSON.stringify(source),
    );
    writeFileSync(
      join(workspace, 'libs/control/package.json'),
      JSON.stringify({
        name: '@anarchitects/control',
        publishConfig: { access: 'public' },
        peerDependencies: { '@nestjs/common': '11.1.6' },
      }),
    );
    execFileSync(
      process.execPath,
      [join(root, 'tools/release/normalize-external-peer-ranges.mjs')],
      { cwd: workspace },
    );
    assert.deepEqual(
      readJson(join(workspace, 'libs/mailer/package.json')),
      source,
    );
    assert.equal(
      readJson(join(workspace, 'libs/control/package.json')).peerDependencies[
        '@nestjs/common'
      ],
      '^11.0.0',
    );
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('Mailer host rejects unsupported or extra arguments before packing or installing', () => {
  for (const args of [[], ['nest13'], ['nest12', '--unexpected']]) {
    const result = spawnSync(
      process.execPath,
      [join(root, 'tools/testing/run-common-mailer-nest-host.mjs'), ...args],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Expected exactly one host/);
    assert.equal(result.stdout, '');
  }
});
