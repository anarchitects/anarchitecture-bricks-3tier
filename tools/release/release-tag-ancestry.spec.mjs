import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(
  new URL('./check-release-tag-ancestry.mjs', import.meta.url),
);

function fixture(t, { initialize = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'release-ancestry-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const env = {
    ...process.env,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: '/dev/null',
  };
  for (const key of Object.keys(env)) {
    if (
      key.startsWith('GIT_') &&
      !['GIT_CONFIG_NOSYSTEM', 'GIT_CONFIG_GLOBAL'].includes(key)
    )
      delete env[key];
  }
  function git(...args) {
    const result = spawnSync('git', args, { cwd: root, env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  }
  function project(name, version = '0.3.0', publishable = true) {
    const path = join(root, 'libs', name);
    mkdirSync(path, { recursive: true });
    writeFileSync(join(path, 'project.json'), JSON.stringify({ name }));
    writeFileSync(
      join(path, 'package.json'),
      JSON.stringify({
        version,
        ...(publishable ? { publishConfig: { access: 'public' } } : {}),
      }),
    );
  }
  function run(...args) {
    const result = spawnSync(process.execPath, [script, ...args], {
      cwd: root,
      env,
      encoding: 'utf8',
    });
    return { ...result, output: result.stdout + result.stderr };
  }
  if (initialize) {
    git('init', '-b', 'main');
    git('config', 'user.name', 'Ancestry fixture');
    git('config', 'user.email', 'fixture@example.invalid');
    git('config', 'commit.gpgsign', 'false');
    git('commit', '--allow-empty', '-m', 'fixture baseline');
  }
  project('forms-ts');
  return { root, git, project, run };
}

test('accepts reachable lightweight and annotated baseline tags with independent patches', (t) => {
  const f = fixture(t);
  f.project('forms-nest', '0.3.2');
  f.git('tag', 'forms-ts@0.3.0');
  f.git('tag', '-a', 'forms-nest@0.3.2', '-m', 'annotated release');
  f.git('commit', '--allow-empty', '-m', 'fix(forms-nest): maintenance patch');
  const result = f.run('--projects=forms-ts,forms-nest', '--require-tags');
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /2 tag\(s\) across 2 selected project/);
});

test('rejects tags from the other release line without changing refs', (t) => {
  const f = fixture(t);
  f.git('branch', 'maint/nest-11');
  f.git('commit', '--allow-empty', '-m', 'feat(forms-ts): new feature line');
  f.git('tag', 'forms-ts@0.3.0');
  const originalTag = f.git('rev-parse', 'refs/tags/forms-ts@0.3.0');
  f.git('switch', 'maint/nest-11');
  f.git('commit', '--allow-empty', '-m', 'fix(forms-ts): maintenance fix');
  const originalHead = f.git('rev-parse', 'HEAD');
  const result = f.run('--require-tags');
  assert.equal(result.status, 1);
  assert.match(result.output, /outside the current branch history/);
  assert.match(result.output, /Never move or rewrite published release tags/);
  assert.equal(f.git('rev-parse', 'refs/tags/forms-ts@0.3.0'), originalTag);
  assert.equal(f.git('rev-parse', 'HEAD'), originalHead);
});

test('limits ancestry checks to explicitly selected projects', (t) => {
  const f = fixture(t);
  f.project('auth-ts');
  f.git('tag', 'forms-ts@0.3.0');
  f.git('switch', '-c', 'other');
  f.git('commit', '--allow-empty', '-m', 'other release');
  f.git('tag', 'auth-ts@0.3.0');
  f.git('switch', 'main');
  const result = f.run('--projects', 'forms-ts', '--require-tags');
  assert.equal(result.status, 0, result.output);
  assert.equal(f.run().status, 1);
});

test('reports absent tags and permits them only outside strict mode', (t) => {
  const f = fixture(t);
  const initial = f.run('--projects=forms-ts');
  assert.equal(initial.status, 0, initial.output);
  assert.match(initial.output, /Missing release tags: forms-ts@0.3.0/);
  assert.match(initial.output, /separately authorize any first release/);
  const strict = f.run('--projects=forms-ts', '--require-tags');
  assert.equal(strict.status, 1);
  assert.match(strict.output, /--require-tags forbids initial releases/);
});

test('rejects unknown, empty and malformed selections or CLI options', (t) => {
  const f = fixture(t);
  f.project('internal', '0.0.0', false);
  for (const args of [
    ['--projects=typo'],
    ['--projects=internal'],
    ['--projects'],
    ['--projects='],
    ['--projects', '--require-tags'],
    ['--projects=forms-ts,'],
    ['--projects= ,forms-ts'],
    ['--project=forms-ts'],
  ]) {
    const result = f.run(...args);
    assert.equal(result.status, 1, JSON.stringify(args));
    assert.doesNotMatch(result.output, /preflight passed/);
  }
});

test('fails when there are no publishable projects', (t) => {
  const f = fixture(t);
  f.project('forms-ts', '0.3.0', false);
  const result = f.run();
  assert.equal(result.status, 1);
  assert.match(result.output, /No publishable projects/);
});

test('does not treat an existing non-commit tag as an initial release', (t) => {
  const f = fixture(t);
  const blob = f.git('hash-object', '-w', 'libs/forms-ts/package.json');
  f.git('tag', 'forms-ts@0.3.0', blob);
  const result = f.run();
  assert.equal(result.status, 1);
  assert.match(result.output, /Git rev-parse failed/);
  assert.doesNotMatch(result.output, /Missing release tags/);
});

test('fails closed on a corrupt tag object', (t) => {
  const f = fixture(t);
  writeFileSync(
    join(f.root, '.git/refs/tags/forms-ts@0.3.0'),
    `${'1'.repeat(40)}\n`,
  );
  const result = f.run();
  assert.equal(result.status, 1);
  assert.doesNotMatch(result.output, /preflight passed/);
});

test('requires Git history even when every package tag is absent', (t) => {
  const f = fixture(t, { initialize: false });
  const result = f.run();
  assert.equal(result.status, 1);
  assert.match(result.output, /Git rev-parse failed/);
});

test('rejects shallow history even with reachable tags', (t) => {
  const f = fixture(t);
  f.git('tag', 'forms-ts@0.3.0');
  writeFileSync(
    join(f.root, '.git/shallow'),
    `${f.git('rev-parse', 'HEAD')}\n`,
  );
  const result = f.run('--require-tags');
  assert.equal(result.status, 1);
  assert.match(result.output, /Full Git history is required/);
});

test('history-dependent ancestry target is explicitly uncached', () => {
  const config = JSON.parse(
    readFileSync(join(dirname(script), 'project.json'), 'utf8'),
  );
  assert.equal(config.targets['check-release-tag-ancestry'].cache, false);
});
