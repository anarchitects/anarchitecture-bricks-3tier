import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { parse } from 'yaml';
import { checkMaintenanceBackport } from './maintenance-backport.mjs';
import { git, commit, releaseProjects } from './release-line.mjs';

const root = resolve(import.meta.dirname, '../..');
const json = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const workflow = (name) =>
  parse(readFileSync(join(root, `.github/workflows/${name}.yml`), 'utf8'));

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'maintenance-backport-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  git(cwd, ['init', '-b', 'maint/nest-11']);
  git(cwd, ['config', 'user.name', 'Backport test']);
  git(cwd, ['config', 'user.email', 'backport@example.invalid']);
  for (const [name, path] of Object.entries(releaseProjects)) {
    mkdirSync(join(cwd, path), { recursive: true });
    writeFileSync(
      join(cwd, path, 'package.json'),
      JSON.stringify({
        name: `@anarchitects/${name}`,
        version: '0.1.0',
        publishConfig: { access: 'public' },
      }),
    );
  }
  git(cwd, ['add', '.']);
  git(cwd, ['commit', '-m', 'feat: accepted baseline']);
  const base = commit(cwd, 'HEAD');
  const options = {
    baseRef: 'maint/nest-11',
    baseSha: base,
    headSha: base,
    branchPoint: base,
    baseline: base,
    title: 'fix(auth-ts): repair a bug',
  };
  return { cwd, options };
}
function change(cwd, message) {
  writeFileSync(join(cwd, 'fix.txt'), message);
  git(cwd, ['add', '.']);
  git(cwd, ['commit', '-m', message]);
  return commit(cwd, 'HEAD');
}

test('accepts a bugfix merge candidate without changing versions', (t) => {
  const { cwd, options } = fixture(t);
  options.headSha = change(cwd, 'fix(auth-ts): repair a bug');
  const result = checkMaintenanceBackport(cwd, options);
  assert.equal(result.mergeSha, options.headSha);
  assert.equal(git(cwd, ['status', '--porcelain']), '');
});

test('rejects feature squash titles even when individual commits say fix', (t) => {
  const { cwd, options } = fixture(t);
  options.headSha = change(cwd, 'fix(auth-ts): repair a bug');
  for (const title of [
    'feat(auth-ts): new feature',
    'fix(auth-ts)!: changed contract',
  ]) {
    assert.throws(
      () => checkMaintenanceBackport(cwd, { ...options, title }),
      /feature\/breaking intent/,
    );
  }
});

test('rejects feature commits concealed behind a fix PR title', (t) => {
  const { cwd, options } = fixture(t);
  options.headSha = change(cwd, 'feat(auth-ts): new feature');
  assert.throws(
    () => checkMaintenanceBackport(cwd, options),
    /feature\/breaking intent/,
  );
});

test('rejects a hand-authored patch version before CI versioning', (t) => {
  const { cwd, options } = fixture(t);
  const path = join(cwd, releaseProjects['auth-ts'], 'package.json');
  const pkg = JSON.parse(readFileSync(path));
  pkg.version = '0.1.1';
  writeFileSync(path, JSON.stringify(pkg));
  options.headSha = change(cwd, 'fix(auth-ts): repair a bug');
  assert.throws(
    () => checkMaintenanceBackport(cwd, options),
    /leave versioning/,
  );
});

test('fails closed on absent PR evidence, wrong base and mismatched checkout', (t) => {
  const { cwd, options } = fixture(t);
  for (const invalid of [
    { baseRef: 'main' },
    { baseSha: 'HEAD' },
    { headSha: '' },
    { title: '' },
  ]) {
    assert.throws(() =>
      checkMaintenanceBackport(cwd, { ...options, ...invalid }),
    );
  }
  options.headSha = change(cwd, 'fix(auth-ts): repair a bug');
  git(cwd, ['checkout', '--detach', options.baseSha]);
  assert.throws(() => checkMaintenanceBackport(cwd, options), /merge checkout/);
});

test('rejects a base before the accepted branch point', (t) => {
  const { cwd, options } = fixture(t);
  const next = change(cwd, 'fix(auth-ts): accepted routing');
  assert.throws(
    () => checkMaintenanceBackport(cwd, { ...options, branchPoint: next }),
    /base predates/,
  );
});

test('maintenance checks run for every PR and edited squash title', () => {
  const ci = workflow('maintenance-ci');
  assert.deepEqual(ci.on.pull_request.branches, ['maint/nest-11']);
  assert.equal(ci.on.pull_request.paths, undefined);
  assert.equal(ci.on.pull_request['paths-ignore'], undefined);
  assert.ok(ci.on.pull_request.types.includes('edited'));
  assert.equal(
    ci.jobs.packed.uses,
    './.github/workflows/nest-compatibility.yml',
  );
  const matrix = workflow('nest-compatibility');
  assert.ok(Object.hasOwn(matrix.on, 'workflow_call'));
  assert.deepEqual(matrix.on.pull_request['branches-ignore'], [
    'maint/nest-11',
  ]);
  assert.equal(ci.jobs.maintenance.if, 'always()');
  assert.deepEqual(ci.jobs.maintenance.needs, ['policy', 'packed']);
  assert.match(
    ci.jobs.maintenance.steps[0].run,
    /POLICY_RESULT.*success.*PACKED_RESULT.*success/,
  );
  for (const name of ['main-ci', 'angular-consumer-compatibility']) {
    assert.ok(workflow(name).on.pull_request.branches.includes('main'));
    assert.ok(
      workflow(name).on.pull_request.branches.includes('maint/nest-11'),
    );
  }
});

test('bootstrap lock has no bypass and cannot affect main', () => {
  const rules = json('.github/rulesets/maintenance-bootstrap.json');
  assert.equal(rules.enforcement, 'active');
  assert.deepEqual(rules.bypass_actors, []);
  assert.deepEqual(rules.conditions.ref_name, {
    include: ['refs/heads/maint/nest-11'],
    exclude: [],
  });
  assert.deepEqual(rules.rules.map((r) => r.type).sort(), [
    'deletion',
    'non_fast_forward',
    'update',
  ]);
});

test('activation requires main, complete maintenance gate and CodeQL with only the existing release bot bypass', () => {
  const rules = json('.github/rulesets/maintenance-active.json');
  assert.equal(rules.enforcement, 'active');
  assert.deepEqual(rules.conditions.ref_name, {
    include: ['refs/heads/maint/nest-11'],
    exclude: [],
  });
  assert.deepEqual(rules.bypass_actors, [
    { actor_id: 3090882, actor_type: 'Integration', bypass_mode: 'always' },
  ]);
  const byType = Object.fromEntries(rules.rules.map((r) => [r.type, r]));
  for (const type of [
    'deletion',
    'non_fast_forward',
    'pull_request',
    'required_linear_history',
    'code_scanning',
  ])
    assert.ok(byType[type]);
  assert.deepEqual(
    byType.required_status_checks.parameters.required_status_checks,
    [
      { context: 'main', integration_id: 15368 },
      { context: 'maintenance', integration_id: 15368 },
    ],
  );
  assert.deepEqual(byType.pull_request.parameters.allowed_merge_methods, [
    'squash',
  ]);
  assert.equal(
    byType.code_scanning.parameters.code_scanning_tools[0].tool,
    'CodeQL',
  );
});

test('published package tags cannot be updated or deleted, including by the release bot', () => {
  const rules = json('.github/rulesets/package-tags.json');
  assert.equal(rules.target, 'tag');
  assert.equal(rules.enforcement, 'active');
  assert.deepEqual(rules.bypass_actors, []);
  assert.deepEqual(
    rules.conditions.ref_name.include.sort(),
    Object.keys(releaseProjects)
      .map((p) => `refs/tags/${p}@*`)
      .sort(),
  );
  assert.deepEqual(rules.conditions.ref_name.exclude, []);
  assert.deepEqual(rules.rules.map((r) => r.type).sort(), [
    'deletion',
    'update',
  ]);
});
