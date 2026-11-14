import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import {
  assertCheckout,
  assertMaintenanceHistory,
  assertMaintenanceManifests,
  assertMaintenanceOptions,
  assertPatchIntent,
  assertPatchVersions,
  assertProjectGraph,
  assertUnusedReleaseTags,
  commit,
  git,
  maintenanceLine,
  readManifests,
  registryPublishDecision,
  releaseGroups,
  releaseProjects,
  resolvePublishTag,
  resolveReleaseLine,
  tagMessage,
} from './release-line.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'release-line-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, ['init', '-b', 'main']);
  git(root, ['config', 'user.name', 'Release test']);
  git(root, ['config', 'user.email', 'release@example.invalid']);
  for (const [project, path] of Object.entries(releaseProjects)) {
    const file = join(root, path, 'package.json');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(
      file,
      JSON.stringify({
        name: `@anarchitects/${project}`,
        version: '0.1.0',
        publishConfig: { access: 'public' },
      }),
    );
  }
  git(root, ['add', '.']);
  git(root, ['commit', '-m', 'feat: accepted R1 baseline']);
  const sha = commit(root, 'HEAD');
  git(root, ['update-ref', 'refs/remotes/origin/main', sha]);
  git(root, ['tag', 'auth-ts@0.1.0']);
  return { root, policy: { baseline: sha, canonical: sha } };
}

function patch(
  root,
  project = 'auth-ts',
  message = 'fix(auth-ts): repair a bug',
) {
  const path = join(root, releaseProjects[project], 'package.json');
  const pkg = JSON.parse(readFileSync(path));
  pkg.version = '0.1.1';
  writeFileSync(path, JSON.stringify(pkg));
  git(root, ['add', '.']);
  git(root, ['commit', '-m', message]);
  return commit(root, 'HEAD');
}

function maintenanceTag(root) {
  git(root, ['checkout', '-b', maintenanceLine]);
  const sha = patch(root);
  git(root, ['update-ref', `refs/remotes/origin/${maintenanceLine}`, sha]);
  git(root, [
    'tag',
    '-a',
    'auth-ts@0.1.1',
    '-m',
    tagMessage('auth-ts@0.1.1', maintenanceLine),
  ]);
  return sha;
}

test('resolves only exact allowlisted branch heads and validates immutable checkout', (t) => {
  const { root, policy } = fixture(t);
  assert.equal(resolveReleaseLine(root, 'main', policy), policy.baseline);
  assertCheckout(root, 'main', policy.baseline, policy);
  for (const line of [
    'refs/heads/main',
    'topic',
    'maint/nest-12',
    'main\nsha=bad',
    '--help',
  ]) {
    assert.throws(
      () => resolveReleaseLine(root, line, policy),
      /Unsupported release line/,
    );
  }
  assert.throws(() => resolveReleaseLine(root, maintenanceLine, policy));
  assert.throws(
    () => assertCheckout(root, 'main', 'HEAD', policy),
    /immutable/,
  );
  const next = patch(root);
  assert.throws(
    () => assertCheckout(root, 'main', policy.baseline, policy),
    /differs/,
  );
  assert.throws(
    () => assertCheckout(root, 'main', next, policy),
    /branch head/,
  );
  git(root, ['update-ref', 'refs/remotes/origin/main', next]);
  writeFileSync(join(root, releaseProjects['auth-ts'], 'package.json'), '{}');
  assert.throws(() => assertCheckout(root, 'main', next, policy), /clean/);
});

test('rejects shallow history, absent baseline and divergent branch ancestry', (t) => {
  const { root, policy } = fixture(t);
  assert.throws(() =>
    resolveReleaseLine(root, 'main', { ...policy, baseline: 'a'.repeat(40) }),
  );
  git(root, ['checkout', '--orphan', 'unrelated']);
  git(root, ['commit', '-m', 'chore: unrelated baseline']);
  git(root, [
    'update-ref',
    `refs/remotes/origin/${maintenanceLine}`,
    commit(root, 'HEAD'),
  ]);
  assert.throws(
    () => resolveReleaseLine(root, maintenanceLine, policy),
    /accepted release baseline/,
  );
  writeFileSync(join(root, '.git/shallow'), `${commit(root, 'HEAD')}\n`);
  assert.throws(() => resolveReleaseLine(root, 'main', policy), /Full history/);
});

test('features and breaking changes cannot be masked by a patch override or zero-major adjustment', () => {
  assertMaintenanceOptions({ bump: 'patch', skipPublish: true });
  assertMaintenanceOptions({ skipPublish: true });
  for (const bump of [
    'init',
    'minor',
    'major',
    'prepatch',
    'prerelease',
    '0.1.1',
  ]) {
    assert.throws(() => assertMaintenanceOptions({ bump, skipPublish: true }));
  }
  assert.throws(
    () => assertMaintenanceOptions({ firstRelease: true, skipPublish: true }),
    /initial/,
  );
  assert.throws(
    () => assertMaintenanceOptions({ bump: 'patch' }),
    /skip-publish/,
  );
  for (const message of [
    'feat: new API',
    'feat(auth-ts): new capability',
    'fix!: changed API',
    'fix(auth-ts)!: changed API',
    'fix: hidden break\n\nBREAKING CHANGE: removed API',
    'fix: hidden break\n\nBREAKING-CHANGE: removed API',
  ]) {
    assert.throws(
      () => assertPatchIntent([message]),
      /feature\/breaking intent/,
    );
  }
  assertPatchIntent([
    'fix: security repair',
    'chore: refresh patch dependency',
    'docs: explain backport',
    'revert: remove unsupported feature',
  ]);
});

test('scans all maintenance history, including features unrelated to the selected domain', (t) => {
  const { root, policy } = fixture(t);
  patch(root, 'identity-ts', 'feat(identity-ts): a feature');
  assert.throws(
    () => assertMaintenanceHistory(root, policy),
    /feature\/breaking intent/,
  );
});

test('validates every maintenance manifest and internal dependency line', (t) => {
  const { root } = fixture(t);
  const baseline = readManifests(root);
  const packages = structuredClone(baseline);
  packages['auth-ts'].version = '0.1.1';
  packages['auth-ts'].dependencies = { '@anarchitects/forms-ts': '^0.1.0' };
  assertMaintenanceManifests(packages, baseline);
  for (const range of [
    '^0.2.0',
    '*',
    '>=0.1.0',
    'workspace:*',
    '^0.1.0 || ^0.2.0',
  ]) {
    packages['auth-ts'].dependencies['@anarchitects/forms-ts'] = range;
    assert.throws(
      () => assertMaintenanceManifests(packages, baseline),
      /crosses maintenance lines/,
    );
  }
  delete packages['auth-ts'].dependencies;
  for (const version of [
    '0.2.0',
    '1.0.0',
    '0.1.1-beta.0',
    '0.0.9',
    'invalid',
  ]) {
    packages['auth-ts'].version = version;
    assert.throws(() => assertMaintenanceManifests(packages, baseline));
  }
});

test('Nx preview must stay within the reviewed cascade and produce stable single patches', () => {
  assertPatchVersions(
    {
      'auth-ts': { currentVersion: '0.1.0', newVersion: '0.1.1' },
      'forms-ts': { currentVersion: '0.1.0', newVersion: null },
    },
    ['auth-ts', 'forms-ts'],
  );
  for (const next of ['0.2.0', '1.0.0', '0.1.2', '0.1.1-beta.0']) {
    assert.throws(() =>
      assertPatchVersions(
        { 'auth-ts': { currentVersion: '0.1.0', newVersion: next } },
        ['auth-ts'],
      ),
    );
  }
  assert.throws(
    () =>
      assertPatchVersions(
        { 'identity-ts': { currentVersion: '0.1.0', newVersion: '0.1.1' } },
        ['auth-ts'],
      ),
    /cascade/,
  );
});

test('target configuration cannot add projects or change package roots', () => {
  const groups = Object.entries(releaseGroups).map(([name, projects]) => ({
    name,
    projects,
  }));
  const nodes = Object.fromEntries(
    Object.entries(releaseProjects).map(([name, root]) => [
      name,
      { data: { root } },
    ]),
  );
  assertProjectGraph(groups, nodes);
  assert.throws(
    () => assertProjectGraph([{ name: 'other', projects: [] }], nodes),
    /Unreviewed release group/,
  );
  assert.throws(
    () => assertProjectGraph([{ name: 'auth', projects: ['auth-ts'] }], nodes),
    /Unreviewed projects/,
  );
  nodes['auth-ts'].data.root = 'libs/elsewhere';
  assert.throws(() => assertProjectGraph(groups, nodes), /Unreviewed root/);
});

test('maintenance markers keep nest11 routing after commits reach main and across retries', (t) => {
  const { root, policy } = fixture(t);
  const sha = maintenanceTag(root);
  const first = resolvePublishTag(root, 'auth-ts@0.1.1', policy);
  assert.equal(first.sha, sha);
  assert.equal(first.distTag, 'nest11');
  assert.equal(first.line, maintenanceLine);
  git(root, ['update-ref', 'refs/remotes/origin/main', sha]);
  assert.deepEqual(resolvePublishTag(root, 'auth-ts@0.1.1', policy), first);
  assertMaintenanceHistory(root, policy);
});

test('legacy accepted tags and annotated main tags retain latest routing', (t) => {
  const { root, policy } = fixture(t);
  assert.equal(
    resolvePublishTag(root, 'auth-ts@0.1.0', policy).distTag,
    'latest',
  );
  const sha = patch(root);
  git(root, ['update-ref', 'refs/remotes/origin/main', sha]);
  git(root, [
    'tag',
    '-a',
    'auth-ts@0.1.1',
    '-m',
    tagMessage('auth-ts@0.1.1', 'main'),
  ]);
  assert.equal(
    resolvePublishTag(root, 'auth-ts@0.1.1', policy).distTag,
    'latest',
  );
});

test('rejects malformed, missing, unreviewed, unmarked or mismatched publish tags', (t) => {
  const { root, policy } = fixture(t);
  for (const tag of [
    '--help',
    'auth-ts@latest',
    'auth-ts@01.1.0',
    'auth-ts@0.1.0\nevil',
    'private@0.1.0',
    'auth-ts@0.1.0;echo',
    'auth-ts@0.1.2',
  ]) {
    assert.throws(() => resolvePublishTag(root, tag, policy));
  }
  const sha = patch(root);
  git(root, ['update-ref', 'refs/remotes/origin/main', sha]);
  git(root, ['tag', 'auth-ts@0.1.1']);
  assert.throws(
    () => resolvePublishTag(root, 'auth-ts@0.1.1', policy),
    /marker/,
  );
  git(root, [
    'tag',
    '-a',
    'auth-ts@0.1.2',
    '-m',
    tagMessage('auth-ts@0.1.2', 'main'),
  ]);
  assert.throws(
    () => resolvePublishTag(root, 'auth-ts@0.1.2', policy),
    /manifest version mismatch/,
  );
});

test('maintenance tags require branch ancestry, patch lines and clean intent', (t) => {
  const { root, policy } = fixture(t);
  maintenanceTag(root);
  git(root, [
    'update-ref',
    `refs/remotes/origin/${maintenanceLine}`,
    policy.baseline,
  ]);
  assert.throws(
    () => resolvePublishTag(root, 'auth-ts@0.1.1', policy),
    /outside maint/,
  );
  git(root, [
    'commit',
    '--allow-empty',
    '-m',
    'feat: unsupported new behavior',
  ]);
  const sha = commit(root, 'HEAD');
  git(root, ['update-ref', `refs/remotes/origin/${maintenanceLine}`, sha]);
  git(root, [
    'tag',
    '-a',
    'forms-ts@0.1.0',
    '-m',
    tagMessage('forms-ts@0.1.0', maintenanceLine),
  ]);
  assert.throws(
    () => resolvePublishTag(root, 'forms-ts@0.1.0', policy),
    /new patch/,
  );
});

test('read-only resolution leaves files, refs and index unchanged', (t) => {
  const { root, policy } = fixture(t);
  maintenanceTag(root);
  const snapshot = () => [
    git(root, ['show-ref']),
    git(root, ['status', '--porcelain']),
    git(root, ['write-tree']),
  ];
  const before = snapshot();
  resolveReleaseLine(root, maintenanceLine, policy);
  assertMaintenanceHistory(root, policy);
  resolvePublishTag(root, 'auth-ts@0.1.1', policy);
  assert.deepEqual(snapshot(), before);
});

test('registry retry never republishes or rolls back either distribution tag', () => {
  for (const distTag of ['latest', 'nest11']) {
    const metadata = {
      versions: ['0.1.1', '0.1.2'],
      'dist-tags': { [distTag]: '0.1.2' },
    };
    assert.equal(
      registryPublishDecision(metadata, { version: '0.1.1', distTag }),
      'skip',
    );
    assert.equal(
      registryPublishDecision(metadata, { version: '0.1.2', distTag }),
      'skip',
    );
    assert.equal(
      registryPublishDecision(metadata, { version: '0.1.3', distTag }),
      'publish',
    );
    assert.throws(
      () => registryPublishDecision(metadata, { version: '0.1.0', distTag }),
      /backwards/,
    );
    assert.equal(
      registryPublishDecision({}, { version: '0.1.1', distTag }),
      'publish',
    );
  }
});

test('planned tags must be unused before version files can be mutated', (t) => {
  const { root } = fixture(t);
  assertUnusedReleaseTags(root, { 'auth-ts': { newVersion: '0.1.1' } });
  assert.throws(
    () => assertUnusedReleaseTags(root, { 'auth-ts': { newVersion: '0.1.0' } }),
    /already exists/,
  );
  assert.throws(
    () => assertUnusedReleaseTags(root, { unknown: { newVersion: '0.1.1' } }),
    /Unreviewed/,
  );
});
