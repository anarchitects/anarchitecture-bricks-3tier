import assert from 'node:assert/strict';
import { appendFileSync, readFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { join } from 'node:path';
import {
  assertCheckout,
  assertMaintenanceHistory,
  assertMaintenanceManifests,
  commit,
  maintenanceLine,
  readManifests,
  releaseBaseline,
  releaseProjects,
  registryPublishDecision,
  resolvePublishTag,
  resolveReleaseLine,
} from './release-line.mjs';

const root = process.cwd();
const env = process.env;
function output(values) {
  for (const [key, value] of Object.entries(values)) {
    assert.ok(!String(value).includes('\n'), 'Invalid workflow output');
    console.log(`${key}=${value}`);
    if (env.GITHUB_OUTPUT)
      appendFileSync(env.GITHUB_OUTPUT, `${key}=${value}\n`);
  }
}

function publishRoute() {
  const route = resolvePublishTag(root, env.RELEASE_TAG);
  if (env.CANDIDATE_SHA)
    assert.equal(
      route.sha,
      env.CANDIDATE_SHA,
      'Release tag moved after resolution',
    );
  if (env.CANDIDATE_TAG_OBJECT)
    assert.equal(
      route.tagObject,
      env.CANDIDATE_TAG_OBJECT,
      'Release tag annotation changed after resolution',
    );
  return route;
}

try {
  const action = process.argv[2];
  if (action === 'resolve') {
    assert.equal(
      env.GITHUB_REF,
      'refs/heads/main',
      'Release routing must execute from main',
    );
    const sha = resolveReleaseLine(root, env.RELEASE_LINE);
    if (env.RELEASE_DRY_RUN !== 'true')
      assert.ok(
        env.CANDIDATE_SHA,
        'Live releases require the SHA reviewed in a dry run',
      );
    if (env.CANDIDATE_SHA)
      assert.equal(
        sha,
        env.CANDIDATE_SHA,
        'Branch differs from approved candidate SHA',
      );
    output({ sha });
  } else if (action === 'checkout') {
    assertCheckout(root, env.RELEASE_LINE, env.CANDIDATE_SHA);
    if (env.RELEASE_LINE === maintenanceLine) assertMaintenanceHistory(root);
  } else if (action === 'tag') {
    assert.equal(
      env.GITHUB_REF,
      'refs/heads/main',
      'Trusted publishing must execute from main',
    );
    output(publishRoute());
  } else if (action === 'artifact') {
    const route = publishRoute();
    assert.equal(
      commit(root, 'HEAD'),
      route.sha,
      'Publish checkout differs from release tag',
    );
    const pkg = JSON.parse(
      readFileSync(
        join(root, 'dist', releaseProjects[route.project], 'package.json'),
        'utf8',
      ),
    );
    assert.equal(
      pkg.name,
      route.packageName,
      'Built package identity mismatch',
    );
    assert.equal(pkg.version, route.version, 'Built package version mismatch');
    assert.ok(!pkg.private, 'Built package is private');
    assert.ok(
      !pkg.publishConfig?.registry ||
        pkg.publishConfig.registry.replace(/\/$/, '') ===
          'https://registry.npmjs.org',
      'Unexpected publish registry',
    );
    if (route.line === maintenanceLine) {
      assertMaintenanceManifests(
        { ...readManifests(root, route.sha), [route.project]: pkg },
        readManifests(root, releaseBaseline),
      );
    }
    // Validate the resolved executor as well as the artifact it will publish.
    const config = JSON.parse(
      execFileSync('yarn', ['nx', 'show', 'project', route.project, '--json'], {
        encoding: 'utf8',
      }),
    );
    const target = config.targets['nx-release-publish'];
    assert.equal(config.root, releaseProjects[route.project]);
    assert.equal(target?.executor, '@nx/js:release-publish');
    assert.equal(
      target.options?.packageRoot?.replace('{projectRoot}', config.root),
      `dist/${config.root}`,
    );
  } else if (action === 'registry') {
    const route = publishRoute();
    const response = spawnSync(
      'npm',
      [
        'view',
        route.packageName,
        'versions',
        'dist-tags',
        '--json',
        '--registry=https://registry.npmjs.org',
      ],
      { encoding: 'utf8' },
    );
    let metadata;
    try {
      metadata = JSON.parse(response.stdout);
    } catch {
      throw new Error('Unable to read npm registry metadata');
    }
    if (response.status !== 0) {
      assert.equal(
        metadata.error?.code,
        'E404',
        'npm registry lookup failed; retry after recovery',
      );
      metadata = {};
    }
    output({ decision: registryPublishDecision(metadata, route) });
  } else {
    throw new Error(`Unsupported release routing action: ${action}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
