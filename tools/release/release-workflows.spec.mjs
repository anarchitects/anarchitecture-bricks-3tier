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
  assert.doesNotMatch(releaseWorkflow, /id-token: write/);
  assert.match(publishWorkflow, /id-token: write/);
  assert.match(publishWorkflow, /release:/);
  assert.match(publishWorkflow, /types:\s*\n\s*- published/);
  assert.match(publishWorkflow, /workflow_dispatch:/);
  assert.match(publishWorkflow, /--projects/);
});
