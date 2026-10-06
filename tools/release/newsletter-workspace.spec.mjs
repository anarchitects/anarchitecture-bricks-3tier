import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import devkit from '@nx/devkit/internal';
import { resolveReleaseGroupsForDomain } from './domain-release-lib.mjs';
import { newsletterBoundaryViolations } from './newsletter-boundaries-lib.mjs';

const { findMatchingProjects } = devkit;
const root = resolve(import.meta.dirname, '../..');
const readJson = (path) =>
  JSON.parse(readFileSync(resolve(root, path), 'utf8'));

test('Newsletter release selection targets exactly its three packages', () => {
  const nodes = {};
  for (const domain of ['newsletter', 'identity']) {
    for (const tech of ['ts', 'nest', 'angular']) {
      const path = `libs/${domain}/${tech}`;
      const project = readJson(`${path}/project.json`);
      nodes[project.name] = {
        name: project.name,
        type: 'lib',
        data: { ...project, root: path },
      };
    }
  }
  const groups = Object.entries(readJson('nx.json').release.groups).map(
    ([name, config]) => ({
      ...config,
      name,
      projects: findMatchingProjects(config.projects, nodes),
    }),
  );
  assert.deepEqual(
    resolveReleaseGroupsForDomain({
      domain: 'newsletter',
      releaseGroups: groups,
      projectNodes: nodes,
    }),
    ['newsletter'],
  );
  assert.deepEqual(
    groups.find(({ name }) => name === 'newsletter').projects.sort(),
    ['newsletter-angular', 'newsletter-nest', 'newsletter-ts'],
  );
  for (const tech of ['ts', 'nest', 'angular']) {
    const project = nodes[`newsletter-${tech}`].data;
    assert.deepEqual(project.release.version.manifestRootsToUpdate, [
      '{projectRoot}',
      'dist/{projectRoot}',
    ]);
    assert.equal(
      project.targets['nx-release-publish'].options.packageRoot,
      `dist/libs/newsletter/${tech}`,
    );
  }
});

test('Newsletter folder requires its domain tag', () => {
  const cwd = mkdtempSync(resolve(tmpdir(), 'newsletter-domain-tags-'));
  const folder = resolve(cwd, 'libs/newsletter/ts');
  const script = resolve(root, 'tools/release/validate-domain-tags.mjs');
  try {
    mkdirSync(folder, { recursive: true });
    writeFileSync(
      resolve(folder, 'project.json'),
      JSON.stringify({ name: 'newsletter-ts', tags: ['tech:ts'] }),
    );
    const rejected = spawnSync(process.execPath, [script], {
      cwd,
      encoding: 'utf8',
    });
    assert.equal(rejected.status, 1);
    assert.match(rejected.stderr, /expected tag "domain:newsletter"/);
    writeFileSync(
      resolve(folder, 'project.json'),
      JSON.stringify({
        name: 'newsletter-ts',
        tags: ['tech:ts', 'domain:newsletter'],
      }),
    );
    assert.match(
      execFileSync(process.execPath, [script], { cwd, encoding: 'utf8' }),
      /validation passed/,
    );
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

const graphForEdge = (sourceTag, targetTag) => ({
  nodes: {
    source: { data: { tags: [sourceTag] } },
    target: { data: { tags: [targetTag] } },
  },
  dependencies: { source: [{ target: 'target' }] },
});

test('Newsletter graph rejects cross-domain edges including future Blog in both directions', () => {
  for (const domain of ['blog', 'forms', 'auth', 'identity']) {
    assert.equal(
      newsletterBoundaryViolations(
        graphForEdge('domain:newsletter', `domain:${domain}`),
      ).length,
      1,
    );
    assert.equal(
      newsletterBoundaryViolations(
        graphForEdge(`domain:${domain}`, 'domain:newsletter'),
      ).length,
      1,
    );
  }
  assert.equal(
    newsletterBoundaryViolations(
      graphForEdge('domain:shared', 'domain:newsletter'),
    ).length,
    1,
  );
});

test('Newsletter graph allows Common, internal dependencies and host composition', () => {
  for (const [source, target] of [
    ['domain:newsletter', 'domain:shared'],
    ['domain:newsletter', 'domain:newsletter'],
    ['type:app', 'domain:newsletter'],
    ['scope:docs', 'domain:newsletter'],
  ])
    assert.deepEqual(
      newsletterBoundaryViolations(graphForEdge(source, target)),
      [],
    );
  const blogHost = graphForEdge('domain:blog', 'domain:newsletter');
  blogHost.nodes.source.type = 'app';
  blogHost.nodes.source.data.root = 'examples/blog';
  assert.deepEqual(newsletterBoundaryViolations(blogHost), []);
});
