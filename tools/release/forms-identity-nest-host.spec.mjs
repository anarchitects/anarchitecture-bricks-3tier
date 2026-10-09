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
import semver from 'semver';

const root = resolve(import.meta.dirname, '../..');
const fixtures = join(root, 'tools/testing/forms-identity-nest-hosts');
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const candidates = readJson(join(fixtures, 'candidates.json')).map(
  (candidate) => ({
    ...candidate,
    source: readJson(join(root, candidate.root, 'package.json')),
  }),
);
const packages = new Map(
  candidates.map((candidate) => [candidate.source.name, candidate]),
);
for (const [host, version, config, orm] of [
  ['nest11', '11.1.6', '4.0.2', '11.0.1'],
  ['nest11-modern', '11.1.6', '12.0.1', '12.0.2'],
  ['nest12', '12.1.2', '12.0.1', '12.0.2'],
]) {
  test(`Forms/Identity ${host} locks a strict, aligned consumer of the release candidates`, () => {
    const manifest = readJson(join(fixtures, host, 'package.json.template'));
    const lock = readJson(join(fixtures, host, 'package-lock.json.template'));
    assert.equal(manifest.private, true);
    assert.equal(lock.lockfileVersion, 3);
    assert.deepEqual(lock.packages[''].dependencies, manifest.dependencies);
    assert.deepEqual(
      lock.packages[''].devDependencies,
      manifest.devDependencies,
    );
    for (const name of ['common', 'core', 'platform-fastify', 'testing'])
      assert.equal(manifest.dependencies[`@nestjs/${name}`], version);
    assert.equal(manifest.dependencies['@nestjs/config'], config);
    assert.equal(manifest.dependencies['@nestjs/typeorm'], orm);
    for (const [name, specifier] of Object.entries({
      ...manifest.dependencies,
      ...manifest.devDependencies,
    })) {
      const candidate = packages.get(name);
      if (candidate) {
        assert.equal(specifier, `file:${candidate.archive}`);
        const entry = lock.packages[`node_modules/${name}`];
        assert.equal(entry.version, candidate.version);
        for (const field of ['dependencies', 'peerDependencies', 'engines'])
          assert.deepEqual(entry[field], candidate.source[field]);
      } else {
        assert.match(specifier, /^\d+\.\d+\.\d+$/);
        assert.equal(lock.packages[`node_modules/${name}`].version, specifier);
      }
    }
    for (const [path, entry] of Object.entries(lock.packages)) {
      assert.ok(!entry.link, `No workspace links: ${path}`);
      if (!path) continue;
      const name = path.replace(/^node_modules\//, '');
      if (packages.has(name)) {
        assert.equal(entry.integrity, undefined);
        for (const [dependency, range] of Object.entries(
          entry.dependencies ?? {},
        )) {
          if (packages.has(dependency))
            assert.ok(
              semver.satisfies(packages.get(dependency).version, range),
              `${name} must admit ${dependency}'s release candidate`,
            );
        }
      } else {
        assert.match(entry.resolved, /^https:\/\/registry\.npmjs\.org\//);
        assert.ok(entry.integrity);
        assert.doesNotMatch(path, /node_modules\/(?:nx$|@nx\/)/);
      }
    }
  });
}

test('Forms/Identity require the new contracts and preserve them during normalization', () => {
  const forms = packages.get('@anarchitects/forms-nest').source;
  const identity = packages.get('@anarchitects/identity-nest').source;
  assert.ok(
    !semver.satisfies(
      '0.4.0',
      forms.dependencies['@anarchitects/common-nest-mailer'],
    ),
  );
  assert.ok(
    !semver.satisfies('0.10.0', forms.dependencies['@anarchitects/forms-ts']),
  );
  assert.ok(
    !semver.satisfies(
      '0.1.0',
      identity.dependencies['@anarchitects/identity-ts'],
    ),
  );
  const workspace = mkdtempSync(
    join(tmpdir(), 'forms-identity-peer-normalization-'),
  );
  try {
    writeFileSync(
      join(workspace, 'package.json'),
      JSON.stringify({ dependencies: { '@nestjs/common': '^11.0.0' } }),
    );
    for (const candidate of candidates.filter(
      (c) => c.source.peerDependencies,
    )) {
      const dir = join(workspace, candidate.root);
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        join(dir, 'package.json'),
        JSON.stringify(candidate.source),
      );
    }
    execFileSync(
      process.execPath,
      [join(root, 'tools/release/normalize-external-peer-ranges.mjs')],
      { cwd: workspace },
    );
    for (const candidate of candidates.filter((c) => c.source.peerDependencies))
      assert.deepEqual(
        readJson(join(workspace, candidate.root, 'package.json')),
        candidate.source,
      );
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('Forms/Identity host rejects unsupported arguments before packing or contacting Docker', () => {
  for (const args of [[], ['nest13'], ['nest12', '--unexpected']]) {
    const result = spawnSync(
      process.execPath,
      [join(root, 'tools/testing/run-forms-identity-nest-host.mjs'), ...args],
      { encoding: 'utf8' },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Expected host/);
    assert.equal(result.stdout, '');
  }
});
