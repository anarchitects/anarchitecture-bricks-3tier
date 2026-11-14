import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import semver from 'semver';

// Reviewed on main. A target checkout must never supply its own routing policy.
export const maintenanceLine = 'maint/nest-11';
export const releaseBaseline = 'fcf2f27b85f9e43dce988ea67150a5aacce934ac';
export const canonicalBaseline = '4ca4d0e46f6741fcaf18ff9df38dee099ff65166';
export const releaseProjects = Object.freeze({
  'auth-angular': 'libs/auth/angular',
  'auth-declarations': 'libs/auth/declarations',
  'auth-nest': 'libs/auth/nest',
  'auth-ts': 'libs/auth/ts',
  'forms-angular': 'libs/forms/angular',
  'forms-nest': 'libs/forms/nest',
  'forms-ts': 'libs/forms/ts',
  'identity-angular': 'libs/identity/angular',
  'identity-nest': 'libs/identity/nest',
  'identity-ts': 'libs/identity/ts',
  'newsletter-angular': 'libs/newsletter/angular',
  'newsletter-nest': 'libs/newsletter/nest',
  'newsletter-ts': 'libs/newsletter/ts',
  'common-nest-mailer': 'libs/common/nest/mailer',
  tailwind: 'libs/common/tailwind',
});
export const releaseGroups = Object.freeze({
  auth: ['auth-angular', 'auth-declarations', 'auth-nest', 'auth-ts'],
  forms: ['forms-angular', 'forms-nest', 'forms-ts'],
  identity: ['identity-angular', 'identity-nest', 'identity-ts'],
  newsletter: ['newsletter-angular', 'newsletter-nest', 'newsletter-ts'],
  'common-nest': ['common-nest-mailer'],
  'common-tailwind': ['tailwind'],
});

export function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

export function isAncestor(root, ancestor, head) {
  const result = spawnSync(
    'git',
    ['merge-base', '--is-ancestor', ancestor, head],
    { cwd: root },
  );
  assert.ok(
    result.status === 0 || result.status === 1,
    'Cannot read complete Git ancestry',
  );
  return result.status === 0;
}

export function commit(root, ref) {
  return git(root, ['rev-parse', '--verify', `${ref}^{commit}`]);
}

export function assertLine(line) {
  assert.ok(
    ['main', maintenanceLine].includes(line),
    `Unsupported release line: ${line}`,
  );
}

function assertHistory(root, baseline, canonical) {
  assert.equal(
    git(root, ['rev-parse', '--is-shallow-repository']),
    'false',
    'Full history and tags are required',
  );
  assert.ok(
    isAncestor(root, commit(root, canonical), commit(root, baseline)),
    'Release baseline must descend from accepted R1',
  );
}

export function resolveReleaseLine(
  root,
  line,
  { baseline = releaseBaseline, canonical = canonicalBaseline } = {},
) {
  assertLine(line);
  assertHistory(root, baseline, canonical);
  const sha = commit(root, `refs/remotes/origin/${line}`);
  assert.ok(
    isAncestor(root, baseline, sha),
    `${line} does not contain the accepted release baseline`,
  );
  return sha;
}

export function assertCheckout(root, line, sha, policy) {
  assert.match(
    sha ?? '',
    /^[a-f0-9]{40}$/,
    'An immutable checkout SHA is required',
  );
  assert.equal(
    commit(root, 'HEAD'),
    sha,
    'Checkout differs from reviewed candidate SHA',
  );
  assert.equal(
    resolveReleaseLine(root, line, policy),
    sha,
    'Candidate is no longer the fetched branch head',
  );
  assert.equal(
    git(root, ['status', '--porcelain', '--untracked-files=no']),
    '',
    'Release checkout must be clean',
  );
}

export function readManifests(root, ref) {
  return Object.fromEntries(
    Object.entries(releaseProjects).map(([project, path]) => [
      project,
      JSON.parse(
        ref
          ? git(root, ['show', `${ref}:${path}/package.json`])
          : readFileSync(join(root, path, 'package.json'), 'utf8'),
      ),
    ]),
  );
}

export function assertProjectGraph(groups, nodes) {
  for (const group of groups) {
    assert.ok(
      Object.hasOwn(releaseGroups, group.name),
      `Unreviewed release group: ${group.name}`,
    );
    assert.deepEqual(
      [...group.projects].sort(),
      [...releaseGroups[group.name]].sort(),
      `Unreviewed projects in ${group.name}`,
    );
    for (const project of group.projects) {
      assert.equal(
        nodes[project]?.data.root,
        releaseProjects[project],
        `Unreviewed root for ${project}`,
      );
    }
  }
}

export function assertMaintenanceOptions({ bump, firstRelease, skipPublish }) {
  assert.ok(!firstRelease, 'Maintenance forbids initial releases');
  assert.ok(
    !bump || bump === 'patch',
    'Maintenance only permits a patch override',
  );
  assert.ok(skipPublish, 'Maintenance versioning must use --skip-publish');
}

export function assertPatchIntent(messages) {
  for (const message of messages) {
    assert.ok(
      !/^(?:feat(?:\([^\n)]*\))?!?:|[\w-]+(?:\([^\n)]*\))?!:|BREAKING[ -]CHANGE:)/im.test(
        message,
      ),
      `Maintenance forbids feature/breaking intent, including with a patch override: ${message.split('\n')[0]}`,
    );
  }
}

export function assertMaintenanceManifests(manifests, baseline) {
  const internal = new Map(
    Object.entries(baseline).map(([project, pkg]) => [pkg.name, project]),
  );
  for (const [project, pkg] of Object.entries(manifests)) {
    const previous = baseline[project];
    assert.ok(
      previous && Object.hasOwn(releaseProjects, project),
      `Unreviewed maintenance project: ${project}`,
    );
    assert.equal(
      pkg.name,
      previous.name,
      `${project}: package identity changed`,
    );
    assert.ok(pkg.publishConfig && !pkg.private, `${project}: not publishable`);
    assert.ok(
      semver.valid(pkg.version) && !semver.prerelease(pkg.version),
      `${project}: stable version required`,
    );
    assert.ok(
      semver.gte(pkg.version, previous.version) &&
        semver.major(pkg.version) === semver.major(previous.version) &&
        semver.minor(pkg.version) === semver.minor(previous.version),
      `${project}: version left its maintenance line`,
    );
    for (const field of [
      'dependencies',
      'peerDependencies',
      'optionalDependencies',
      'devDependencies',
    ]) {
      for (const [name, range] of Object.entries(pkg[field] ?? {})) {
        const dependency = internal.get(name);
        if (!dependency) continue;
        const version = baseline[dependency].version;
        const floor = `${semver.major(version)}.${semver.minor(version)}.0`;
        const ceiling = semver.inc(floor, 'minor');
        assert.ok(
          semver.validRange(range) &&
            semver.subset(range, `>=${floor} <${ceiling}`),
          `${project}: ${name} dependency crosses maintenance lines: ${range}`,
        );
      }
    }
  }
}

export function assertMaintenanceHistory(
  root,
  { baseline = releaseBaseline } = {},
) {
  assertPatchIntent(
    git(root, ['log', '--format=%B%x00', `${baseline}..HEAD`]).split('\0'),
  );
  assertMaintenanceManifests(
    readManifests(root),
    readManifests(root, baseline),
  );
}

export function assertPatchVersions(versionData, allowedProjects) {
  for (const [project, data] of Object.entries(versionData)) {
    assert.ok(
      allowedProjects.includes(project),
      `Unreviewed release cascade: ${project}`,
    );
    assert.ok(
      !data.dockerVersion,
      'Maintenance does not support Docker releases',
    );
    if (data.newVersion == null) continue;
    assert.equal(
      data.newVersion,
      semver.inc(data.currentVersion, 'patch'),
      `${project}: maintenance requires exactly one stable patch`,
    );
  }
}

export function assertUnusedReleaseTags(root, versionData) {
  for (const [project, data] of Object.entries(versionData)) {
    if (data.newVersion == null) continue;
    assert.ok(
      Object.hasOwn(releaseProjects, project) && semver.valid(data.newVersion),
      'Unreviewed proposed package tag',
    );
    const tag = `${project}@${data.newVersion}`;
    const result = spawnSync(
      'git',
      ['show-ref', '--verify', '--quiet', `refs/tags/${tag}`],
      { cwd: root },
    );
    assert.equal(
      result.status,
      1,
      `Proposed release tag already exists or cannot be checked: ${tag}`,
    );
  }
}

export function tagMessage(tag, line) {
  assertLine(line);
  return `${tag}\n\nanarchitecture-release-line: ${line}`;
}

export function resolvePublishTag(
  root,
  tag,
  { baseline = releaseBaseline, canonical = canonicalBaseline } = {},
) {
  assertHistory(root, baseline, canonical);
  const match = /^([a-z][a-z0-9-]*)@(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(
    tag,
  );
  assert.ok(
    match && Object.hasOwn(releaseProjects, match[1]) && semver.valid(match[2]),
    'Expected an allowlisted project@semver tag',
  );
  const [, project, version] = match;
  const sha = commit(root, `refs/tags/${tag}`);
  const tagObject = git(root, ['rev-parse', '--verify', `refs/tags/${tag}`]);
  const message = git(root, [
    'for-each-ref',
    '--format=%(contents)',
    `refs/tags/${tag}`,
  ]);
  const markers = [
    ...message.matchAll(/^anarchitecture-release-line: (.+)$/gm),
  ];
  assert.ok(markers.length <= 1, 'Ambiguous release-line marker');
  let line = markers[0]?.[1];
  if (line) {
    assert.equal(
      git(root, ['cat-file', '-t', tagObject]),
      'tag',
      'Release-line markers require annotated tags',
    );
    assert.ok(
      isAncestor(root, baseline, sha),
      'New release tag lacks the accepted release baseline',
    );
  }
  if (!line) {
    // Legacy tags can only use the already accepted, immutable baseline history.
    assert.ok(
      isAncestor(root, sha, baseline),
      'New release tags must carry a release-line marker',
    );
    line = 'main';
  }
  assertLine(line);
  assert.ok(
    isAncestor(root, sha, commit(root, `refs/remotes/origin/${line}`)),
    `Tag is outside ${line} ancestry`,
  );
  const pkg = JSON.parse(
    git(root, ['show', `${sha}:${releaseProjects[project]}/package.json`]),
  );
  assert.equal(
    pkg.name,
    project === 'tailwind'
      ? '@anarchitects/tailwind'
      : `@anarchitects/${project}`,
    'Tag/package identity mismatch',
  );
  assert.equal(pkg.version, version, 'Tag/manifest version mismatch');
  assert.ok(
    pkg.publishConfig && !pkg.private,
    'Tag does not identify a publishable package',
  );
  if (line === maintenanceLine) {
    assert.ok(
      isAncestor(root, baseline, sha),
      'Maintenance tag lacks the accepted release baseline',
    );
    assert.ok(
      semver.gt(version, readManifests(root, baseline)[project].version),
      'Maintenance must publish a new patch',
    );
    const previousVersion = `${semver.major(version)}.${semver.minor(version)}.${semver.patch(version) - 1}`;
    const previous = commit(root, `refs/tags/${project}@${previousVersion}`);
    assert.ok(
      previous !== sha && isAncestor(root, previous, sha),
      'Maintenance tag requires its preceding patch in line ancestry',
    );
    assertMaintenanceManifests(
      readManifests(root, sha),
      readManifests(root, baseline),
    );
    assertPatchIntent(
      git(root, ['log', '--format=%B%x00', `${baseline}..${sha}`]).split('\0'),
    );
  }
  return {
    project,
    version,
    sha,
    tagObject,
    line,
    distTag: line === maintenanceLine ? 'nest11' : 'latest',
    packageName: pkg.name,
  };
}

// Never let a retry move a dist-tag backwards or re-publish an existing version.
export function registryPublishDecision(metadata, { version, distTag }) {
  const versions = Array.isArray(metadata.versions)
    ? metadata.versions
    : [metadata.versions];
  if (versions.includes(version)) return 'skip';
  const current = metadata['dist-tags']?.[distTag];
  assert.ok(
    !current || (semver.valid(current) && semver.gt(version, current)),
    `Refusing to move ${distTag} backwards from ${current} to ${version}`,
  );
  return 'publish';
}
