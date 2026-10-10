import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { delimiter, dirname, resolve } from 'node:path';
import test from 'node:test';
import semver from 'semver';
import { parse } from 'yaml';
import {
  nestPackages,
  validateNestPackageContract,
} from './nest-package-contract.mjs';
import {
  ciLanes,
  fixtureDirectory,
  hostCases,
} from '../testing/nest-compatibility-matrix.mjs';
import { nestHostRuntime } from '../testing/nest-host-runtime.mjs';

const root = resolve(import.meta.dirname, '../..');
const json = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));

function artifact(project) {
  const source = json(`${project.root}/package.json`);
  const built = structuredClone(source);
  if (source.typesVersions) {
    built.exports = {
      './package.json': './package.json',
      '.': { types: source.types, default: source.main },
    };
    for (const layer of Object.keys(source.typesVersions['*'])) {
      built.exports[`./${layer}`] = `./src/${layer}/index.js`;
      built.exports[`./${layer}/index`] = `./src/${layer}/index.js`;
    }
  }
  const files = new Set(['package.json', ...project.requiredFiles]);
  const collect = (value) => {
    if (typeof value === 'string') files.add(value.replace(/^\.\//, ''));
    else if (value && typeof value === 'object')
      Object.values(value).forEach(collect);
  };
  collect(built.exports);
  collect(built.typesVersions);
  for (const field of ['main', 'module', 'types']) collect(built[field]);
  return { source, built, packed: structuredClone(built), files: [...files] };
}
const validate = (project, a) =>
  validateNestPackageContract(project, a.source, a.built, a.packed, a.files);

test('all six package contracts accept preserved manifests and complete exports', () => {
  assert.equal(nestPackages.length, 6);
  for (const project of nestPackages) validate(project, artifact(project));
});

test('contract validator rejects peer, engine and optional-peer drift at build/pack boundaries', () => {
  const project = nestPackages.find((p) => p.name === 'newsletter-nest');
  for (const stage of ['built', 'packed']) {
    for (const field of [
      'peerDependencies',
      'peerDependenciesMeta',
      'engines',
      'typesVersions',
    ]) {
      const a = artifact(project);
      delete a[stage][field];
      assert.throws(() => validate(project, a), /source\/build|build\/packed/);
    }
  }
  const a = artifact(project);
  a.source.peerDependencies['@nestjs/common'] = '^11.0.0';
  assert.throws(() => validate(project, a), /supported peers/);
});

test('contract validator rejects missing secondary exports, CJS/ESM files and declaration files', () => {
  for (const name of ['auth-declarations', 'forms-nest']) {
    const project = nestPackages.find((p) => p.name === name);
    const valid = artifact(project);
    for (const file of valid.files.filter((file) =>
      /\.(?:js|cjs|d\.ts)$/.test(file),
    )) {
      const a = structuredClone(valid);
      a.files = a.files.filter((entry) => entry !== file);
      assert.throws(() => validate(project, a), /missing packed/);
    }
  }
  const project = nestPackages.find((p) => p.name === 'forms-nest');
  const a = artifact(project);
  delete a.built.exports['./application'];
  delete a.packed.exports['./application'];
  assert.throws(() => validate(project, a), /generated exports/);
});

test('runtime packages cannot acquire Nx or generator dependencies', () => {
  const project = nestPackages.find((p) => p.name === 'common-nest-mailer');
  const a = artifact(project);
  for (const stage of ['source', 'built', 'packed'])
    a[stage].dependencies['@anarchitects/nest'] = '0.0.3';
  assert.throws(() => validate(project, a), /runtime tooling dependency/);
});

test('CI covers every matrix lane and executes the uncached Nx host target', () => {
  const workflow = parse(
    readFileSync(
      resolve(root, '.github/workflows/nest-compatibility.yml'),
      'utf8',
    ),
  );
  const job = workflow.jobs['packed-hosts'];
  assert.deepEqual(job.strategy.matrix.include, ciLanes);
  assert.equal(job.strategy['fail-fast'], false);
  assert(
    job.steps.some((step) =>
      step.run?.includes('release-tools:test-nest-compatibility:'),
    ),
  );
  assert(job.steps.some((step) => step.run?.includes('NEST_HOST_NODE=')));
  const targets = json('tools/release/project.json').targets;
  assert.equal(targets['test-nest-compatibility'].cache, false);
  assert.deepEqual(targets['test-nest-compatibility'].dependsOn, [
    'validate-nest-package-compatibility',
  ]);
});

for (const lane of ciLanes) {
  test(`${lane.suite} / Node ${lane.node}: all locked host dependencies admit the runtime`, () => {
    const { cases, exclusions } = hostCases(lane.suite, lane.node);
    assert.equal(
      cases.length,
      lane.node.startsWith('20.') ? 7 : lane.suite === 'nest11' ? 9 : 5,
    );
    assert.equal(exclusions.length, lane.node.startsWith('20.') ? 1 : 0);
    for (const { family, configuration } of cases) {
      const path = fixtureDirectory(family, configuration);
      const manifest = json(`${path}/package.json.template`);
      const lock = json(`${path}/package-lock.json.template`);
      assert.deepEqual(lock.packages[''].engines, manifest.engines);
      for (const [name, entry] of Object.entries(lock.packages))
        if (entry.engines?.node)
          assert.ok(
            semver.satisfies(lane.node, entry.engines.node),
            `${path}: ${name || 'host'} requires ${entry.engines.node}`,
          );
    }
  });
}

test('matrix rejects unsupported lanes instead of silently skipping them', () => {
  assert.throws(() => hostCases('nest12', '20.19.0'), /file-type/);
  assert.throws(() => hostCases('nest13', '24.11.0'), /Expected suite/);
  assert.throws(() => hostCases('nest11', '22.12.0'), /Unsupported consumer/);
});

test('consumer runtime clears injected loaders and takes precedence in npm PATH', () => {
  const runtime = nestHostRuntime({
    ...process.env,
    NEST_HOST_NODE: process.execPath,
    NODE_PATH: '/unwanted',
    NODE_OPTIONS: '--invalid-option',
  });
  assert.equal(runtime.version, process.version);
  assert.equal(runtime.env.NODE_PATH, undefined);
  assert.equal(runtime.env.NODE_OPTIONS, undefined);
  assert.equal(runtime.env.PATH.split(delimiter)[0], dirname(process.execPath));
  assert.throws(() => nestHostRuntime({ NEST_HOST_NODE: 'node' }), /absolute/);
});
