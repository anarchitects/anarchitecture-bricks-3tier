import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { isDocsOnlyChange } from './docs-surface-lib.mjs';
import { parse } from 'yaml';

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
  assert.match(releaseWorkflow, /--group=\$COMMON_GROUP/);
  assert.doesNotMatch(releaseWorkflow, /- common-angular\b/);
  assert.match(releaseWorkflow, /- init\b/);
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
  assert.match(readme, /init\(<nx-project-name>\).*semverBump: none/s);
  assert.match(contributing, /init\(<nx-project-name>\).*semverBump: none/s);
  assert.match(commitValidator, /allowedTypes.*'init'/);
});

test('manual releases separate immutable control and candidate checkouts and gate writes behind preview', () => {
  const workflow = parse(
    readFileSync(
      resolve(workspaceRoot, '.github/workflows/release.yml'),
      'utf8',
    ),
  );
  const inputs = workflow.on.workflow_dispatch.inputs;
  assert.deepEqual(inputs.line.options, ['main', 'maint/nest-11']);
  assert.equal(inputs.dry_run.default, true);
  assert.equal(inputs.bump.default, 'auto');
  const steps = workflow.jobs.release.steps;
  const checkout = steps.filter((step) =>
    step.uses?.startsWith('actions/checkout@'),
  );
  assert.equal(checkout.length, 2);
  assert.equal(checkout[0].with.path, 'control');
  assert.equal(checkout[0].with.ref, '${{ github.sha }}');
  assert.equal(checkout[1].with.path, 'source');
  assert.equal(checkout[1].with.ref, '${{ steps.candidate.outputs.sha }}');
  for (const step of checkout) {
    assert.equal(step.with['persist-credentials'], false);
    assert.equal(step.with['fetch-depth'], 0);
  }
  const preview = steps.findIndex((step) => step.run?.includes('--dry-run'));
  const token = steps.findIndex((step) => step.id === 'app-token');
  const mutate = steps.findIndex((step) =>
    step.run?.includes('gh auth setup-git'),
  );
  assert.ok(preview > 0 && token > preview && mutate > token);
  for (const index of [token, mutate])
    assert.equal(steps[index].if, '${{ !inputs.dry_run }}');
  assert.match(steps[mutate].run, /--expected-groups=/);
  assert.match(steps[mutate].run, /--expected-sha=/);
  assert.match(steps[mutate].run, /--skip-publish/);
  assert.ok(
    steps.some((step) => step.run?.includes('api-specs:conformance-http')),
  );
  assert.ok(
    steps.some((step) =>
      step.run?.includes('test-nest-compatibility --configuration=nest11'),
    ),
  );
  for (const step of steps) {
    if (step.uses?.startsWith('./'))
      assert.ok(step.uses.startsWith('./control/'));
    if (step.run)
      assert.doesNotMatch(
        step.run,
        /\$\{\{\s*inputs\./,
        'Dispatch values must enter shells through quoted environment variables',
      );
  }
});

test('publishing relays tag events to main, validates artifacts and serializes each package', () => {
  const workflow = parse(
    readFileSync(
      resolve(workspaceRoot, '.github/workflows/publish.yml'),
      'utf8',
    ),
  );
  assert.equal(workflow.permissions['id-token'], undefined);
  assert.equal(
    workflow.jobs['route-release'].if,
    "github.event_name == 'release'",
  );
  assert.equal(
    workflow.jobs['route-release'].permissions?.['id-token'],
    undefined,
  );
  assert.deepEqual(workflow.on.repository_dispatch.types, ['publish-package']);
  const job = workflow.jobs.publish;
  assert.equal(job.if, "github.event_name != 'release'");
  assert.equal(job.permissions['id-token'], 'write');
  assert.equal(job.needs, 'select-package');
  assert.match(job.concurrency.group, /needs.select-package.outputs.project/);
  const steps = job.steps;
  assert.match(steps[0].run, /refs\/heads\/main/);
  const publishIndex = steps.findIndex((step) =>
    step.run?.includes('nx release publish'),
  );
  const artifactIndex = steps.findIndex((step) =>
    step.run?.includes('release-route.mjs artifact'),
  );
  const registryIndex = steps.findIndex((step) =>
    step.run?.includes('release-route.mjs registry'),
  );
  assert.ok(
    publishIndex > registryIndex &&
      registryIndex > artifactIndex &&
      artifactIndex > 0,
  );
  assert.equal(
    steps[publishIndex].if,
    "steps.registry.outputs.decision == 'publish'",
  );
  assert.match(steps[publishIndex].run, /--tag "\$DIST_TAG"/);
  for (const index of [artifactIndex, registryIndex]) {
    assert.equal(
      steps[index].env.CANDIDATE_SHA,
      '${{ steps.tag.outputs.sha }}',
    );
    assert.equal(
      steps[index].env.CANDIDATE_TAG_OBJECT,
      '${{ steps.tag.outputs.tagObject }}',
    );
  }
  for (const step of steps) {
    if (step.uses?.startsWith('./'))
      assert.ok(step.uses.startsWith('./control/'));
    if (step.run)
      assert.doesNotMatch(
        step.run,
        /\$\{\{/,
        'Event values must not be interpolated into shell code',
      );
  }
});
