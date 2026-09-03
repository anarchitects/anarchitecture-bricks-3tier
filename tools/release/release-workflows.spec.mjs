import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

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
  assert.match(releaseWorkflow, /--group=\$\{\{ inputs\.common_group \}\}/);
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
