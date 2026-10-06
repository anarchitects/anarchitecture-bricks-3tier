import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { isDocsOnlyChange } from './docs-surface-lib.mjs';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('non-bumping policy applies to PRs containing only docs-surface files', () => {
  const files = [
    'docs/guides/ai-agents.md',
    'tools/angular-docs/generate.mjs',
    'tools/docs-hub/src/index.ts',
    'libs/forms/angular/feature/README.md',
    'README.md',
    'CONTRIBUTING.md',
    '.github/workflows/docs-pages.yml',
  ];

  for (const file of files) {
    assert.equal(isDocsOnlyChange([file]), true, file);
  }
  assert.equal(isDocsOnlyChange(files), true);
});

test('feature changes retain release semantics when accompanied by a README', () => {
  const files = [
    'libs/forms/angular/feature/README.md',
    'libs/forms/angular/feature/src/forms-submissions-feature.provider.spec.ts',
    'libs/forms/angular/feature/src/forms-submissions-feature.provider.ts',
    'libs/forms/angular/feature/src/index.ts',
  ];

  assert.equal(isDocsOnlyChange(files), false);
  assert.equal(isDocsOnlyChange([...files].reverse()), false);
});

test('non-bumping policy skips empty and non-docs changes', () => {
  assert.equal(isDocsOnlyChange([]), false);
  assert.equal(
    isDocsOnlyChange(['libs/forms/angular/state/src/forms.store.ts']),
    false,
  );
  assert.equal(isDocsOnlyChange(['README.md', 'package.json']), false);
  assert.equal(
    isDocsOnlyChange(['docs/guide.md', '.github/workflows/main-ci.yml']),
    false,
  );
});

test('release workflows separate versioning from OIDC trusted publishing', () => {
  const releaseWorkflow = readFileSync(
    resolve(workspaceRoot, '.github/workflows/release.yml'),
    'utf8',
  );
  const publishWorkflow = readFileSync(
    resolve(workspaceRoot, '.github/workflows/publish.yml'),
    'utf8',
  );

  for (const workflow of [releaseWorkflow, publishWorkflow]) {
    assert.doesNotMatch(workflow, /NPM_TOKEN|NODE_AUTH_TOKEN/);
  }

  assert.match(releaseWorkflow, /--skip-publish/);
  assert.match(releaseWorkflow, /- newsletter\b/);
  assert.match(releaseWorkflow, /--group=\$\{\{ inputs\.common_group \}\}/);
  assert.doesNotMatch(releaseWorkflow, /- common-angular\b/);
  assert.match(releaseWorkflow, /options:\s*\n\s*- init/);
  assert.doesNotMatch(releaseWorkflow, /id-token: write/);
  assert.match(publishWorkflow, /id-token: write/);
  assert.match(publishWorkflow, /release:/);
  assert.match(publishWorkflow, /types:\s*\n\s*- published/);
  assert.match(publishWorkflow, /workflow_dispatch:/);
  assert.match(publishWorkflow, /--projects/);
  assert.match(
    publishWorkflow,
    /release-tools:validate-tailwind-registry --skip-nx-cache/,
  );
  assert.match(
    publishWorkflow,
    /angular-consumer-compatibility:test-22 --skip-nx-cache/,
  );
  assert.match(
    publishWorkflow,
    /ANARCHITECTS_TAILWIND_VERSION:.*steps\.tag\.outputs\.version/,
  );
});

test('first-release guidance uses the non-bumping init commit type', () => {
  const nxConfig = JSON.parse(
    readFileSync(resolve(workspaceRoot, 'nx.json'), 'utf8'),
  );
  const readme = readFileSync(resolve(workspaceRoot, 'README.md'), 'utf8');
  const contributing = readFileSync(
    resolve(workspaceRoot, 'CONTRIBUTING.md'),
    'utf8',
  );
  const commitValidator = readFileSync(
    resolve(workspaceRoot, 'tools/release/validate-non-bumping-commits.mjs'),
    'utf8',
  );

  assert.equal(
    nxConfig.release.conventionalCommits.types.init.semverBump,
    'none',
  );
  assert.match(readme, /init\(<project-or-domain>\).*semverBump: none/s);
  assert.match(contributing, /init\(<project-or-domain>\).*semverBump: none/s);
  assert.match(commitValidator, /allowedTypes.*'init'/);
});
