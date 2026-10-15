import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import semver from 'semver';

const families = ['auth', 'forms-identity', 'newsletter'];
const dependencyFields = [
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
];
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const fixtureRoot = (root, family) =>
  join(root, 'tools/testing', `${family}-nest-hosts`);

export function readHostPackageManifests(root) {
  const manifests = {};
  for (const family of families) {
    for (const candidate of readJson(
      join(fixtureRoot(root, family), 'candidates.json'),
    )) {
      manifests[candidate.root] = readJson(
        join(root, candidate.root, 'package.json'),
      );
    }
  }
  return manifests;
}

// Only Nx's version/internal-range changes may enter the fixture locks here.
// Dependency upgrades still require an explicit reviewed lock refresh. No npm
// resolution, tarball mutation or normal-test lock regeneration is performed.
export function planHostFixtureVersions(root, before, after) {
  const localNames = new Set(
    Object.values(before).map((manifest) => manifest.name),
  );
  for (const [project, previous] of Object.entries(before)) {
    const current = after[project];
    assert.ok(current, `Missing versioned manifest: ${project}`);
    const metadata = ({
      version,
      dependencies,
      optionalDependencies,
      peerDependencies,
      ...rest
    }) => rest;
    assert.deepEqual(
      metadata(current),
      metadata(previous),
      `${project}: release changed package metadata`,
    );
    assert.ok(
      semver.gte(current.version, previous.version),
      `${project}: release cannot lower versions`,
    );
    for (const field of dependencyFields) {
      assert.deepEqual(
        Object.keys(current[field] ?? {}).sort(),
        Object.keys(previous[field] ?? {}).sort(),
        `${project}: release changed ${field} names`,
      );
      for (const [name, range] of Object.entries(current[field] ?? {})) {
        if (range !== previous[field][name]) {
          assert.ok(
            localNames.has(name),
            `${project}: release changed external dependency ${name}`,
          );
        }
      }
    }
  }

  const changes = [];
  const record = (path, value) => {
    const original = readFileSync(path, 'utf8');
    if (!isDeepStrictEqual(JSON.parse(original), value)) {
      changes.push({ path, content: `${JSON.stringify(value, null, 2)}\n` });
    }
  };
  for (const family of families) {
    const directory = fixtureRoot(root, family);
    const path = join(directory, 'candidates.json');
    const candidates = readJson(path);
    const next = candidates.map((candidate) => ({
      ...candidate,
      // Preserve reviewed future candidates until the source catches up.
      version: semver.gt(after[candidate.root].version, candidate.version)
        ? after[candidate.root].version
        : candidate.version,
    }));
    record(path, next);
    for (const config of readdirSync(directory, { withFileTypes: true }).filter(
      (entry) => entry.isDirectory(),
    )) {
      const lockPath = join(
        directory,
        config.name,
        'package-lock.json.template',
      );
      const lock = readJson(lockPath);
      const installed = new Map();
      for (const [index, candidate] of candidates.entries()) {
        const previous = before[candidate.root];
        const current = after[candidate.root];
        const entry = lock.packages[`node_modules/${previous.name}`];
        if (!entry) {
          assert.ok(
            family === 'newsletter' &&
              config.name.endsWith('-optional') &&
              previous.name === '@anarchitects/common-nest-mailer',
            `${previous.name}: missing packed-host lock entry`,
          );
          assert.ok(
            !lock.packages[''].dependencies?.[previous.name],
            `${previous.name}: missing direct dependency`,
          );
          continue; // Newsletter's explicitly optional hosts omit Mailer.
        }
        assert.equal(entry.resolved, `file:${candidate.archive}`);
        assert.equal(entry.integrity, undefined);
        assert.equal(
          entry.version,
          candidate.version,
          `${previous.name}: stale fixture version`,
        );
        for (const field of [
          ...dependencyFields,
          'peerDependenciesMeta',
          'engines',
        ]) {
          assert.deepEqual(
            entry[field],
            previous[field],
            `${previous.name}: refresh lock ${field} before release`,
          );
        }
        entry.version = next[index].version;
        for (const field of dependencyFields) {
          for (const [name, range] of Object.entries(current[field] ?? {})) {
            entry[field][name] = range;
          }
        }
        installed.set(previous.name, entry);
      }
      for (const [name, entry] of installed) {
        for (const [dependency, range] of Object.entries({
          ...entry.dependencies,
          ...entry.optionalDependencies,
          ...entry.peerDependencies,
        })) {
          if (installed.has(dependency)) {
            assert.ok(
              semver.satisfies(installed.get(dependency).version, range),
              `${name}: ${dependency} candidate does not satisfy ${range}`,
            );
          }
        }
      }
      record(lockPath, lock);
    }
  }
  return changes;
}
