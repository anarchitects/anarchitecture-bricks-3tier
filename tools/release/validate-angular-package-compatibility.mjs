import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function findProjectJsonFiles(rootDir) {
  const projectFiles = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);

      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && entry.name === 'project.json') {
        projectFiles.push(fullPath);
      }
    }
  }

  return projectFiles;
}

function selectorMatchesProject(selector, projectName, projectRoot) {
  if (!selector.startsWith('directory:')) {
    return selector === projectName;
  }

  const directoryPattern = selector.slice('directory:'.length);
  const directoryPrefix = directoryPattern.endsWith('/**')
    ? directoryPattern.slice(0, -3)
    : directoryPattern;

  return (
    projectRoot === directoryPrefix ||
    projectRoot.startsWith(`${directoryPrefix}/`)
  );
}

function findReleaseGroups(releaseGroups, projectName, projectRoot) {
  return Object.entries(releaseGroups)
    .filter(([, group]) =>
      group.projects.some((selector) =>
        selectorMatchesProject(selector, projectName, projectRoot),
      ),
    )
    .map(([groupName]) => groupName);
}

function supportsMajor(range, major) {
  return range
    .split('||')
    .map((part) => part.trim())
    .some((part) => part.startsWith(`^${major}.`));
}

function comparePeerDependencies(sourceManifest, packedManifest) {
  return (
    JSON.stringify(sourceManifest.peerDependencies ?? {}) ===
    JSON.stringify(packedManifest.peerDependencies ?? {})
  );
}

function packAndReadManifest(projectRoot, packingRoot) {
  const tarballDirectory = join(packingRoot, 'tarballs');
  const npmCacheDirectory = join(packingRoot, 'npm-cache');
  mkdirSync(tarballDirectory, { recursive: true });

  const packResult = JSON.parse(
    execFileSync(
      'npm',
      [
        'pack',
        projectRoot,
        '--pack-destination',
        tarballDirectory,
        '--cache',
        npmCacheDirectory,
        '--json',
      ],
      { encoding: 'utf8' },
    ),
  );
  const archivePath = join(tarballDirectory, packResult[0].filename);

  return JSON.parse(
    execFileSync('tar', ['-xOf', archivePath, 'package/package.json'], {
      encoding: 'utf8',
    }),
  );
}

const workspaceRoot = process.cwd();
const validatePackedManifests = process.argv.includes('--dist');
const nxConfig = readJson(join(workspaceRoot, 'nx.json'));
const releaseGroups = nxConfig.release?.groups ?? {};
const errors = [];
const results = [];
const packingRoot = validatePackedManifests
  ? mkdtempSync(join(tmpdir(), 'anarchitects-angular-packs-'))
  : null;

for (const projectJsonFile of findProjectJsonFiles(
  join(workspaceRoot, 'libs'),
)) {
  const projectConfig = readJson(projectJsonFile);
  const tags = Array.isArray(projectConfig.tags) ? projectConfig.tags : [];

  if (!tags.includes('tech:angular')) {
    continue;
  }

  const projectRoot = relative(workspaceRoot, dirname(projectJsonFile));
  const sourceManifestPath = join(workspaceRoot, projectRoot, 'package.json');

  if (!existsSync(sourceManifestPath)) {
    errors.push(`${projectConfig.name}: missing package.json`);
    continue;
  }

  const sourceManifest = readJson(sourceManifestPath);
  const isPublic = sourceManifest.private !== true;
  const groups = findReleaseGroups(
    releaseGroups,
    projectConfig.name,
    projectRoot,
  );

  if (isPublic && groups.length === 0) {
    errors.push(
      `${projectConfig.name}: public Angular package is not covered by an Nx release group`,
    );
  }

  if (!isPublic && groups.length > 0) {
    errors.push(
      `${projectConfig.name}: private Angular project is unexpectedly covered by release group(s) ${groups.join(', ')}`,
    );
  }

  for (const [dependencyName, range] of Object.entries(
    sourceManifest.peerDependencies ?? {},
  )) {
    if (
      (dependencyName.startsWith('@angular/') ||
        dependencyName.startsWith('@ngrx/')) &&
      (!supportsMajor(range, 21) || !supportsMajor(range, 22))
    ) {
      errors.push(
        `${projectConfig.name}: ${dependencyName} peer range "${range}" must cover majors 21 and 22`,
      );
    }

    if (dependencyName === 'rxjs' && !range.includes('7.8')) {
      errors.push(
        `${projectConfig.name}: rxjs peer range "${range}" must retain RxJS 7.8 compatibility`,
      );
    }

    if (dependencyName.startsWith('@storybook/') && !range.includes('10.')) {
      errors.push(
        `${projectConfig.name}: ${dependencyName} peer range "${range}" must cover Storybook 10`,
      );
    }
  }

  if (validatePackedManifests && isPublic) {
    const packedManifestPath = join(
      workspaceRoot,
      'dist',
      projectRoot,
      'package.json',
    );

    if (!existsSync(packedManifestPath)) {
      errors.push(
        `${projectConfig.name}: missing built package manifest at ${relative(workspaceRoot, packedManifestPath)}`,
      );
    } else {
      const builtManifest = readJson(packedManifestPath);

      if (!comparePeerDependencies(sourceManifest, builtManifest)) {
        errors.push(
          `${projectConfig.name}: built peerDependencies differ from the source manifest`,
        );
      } else {
        const packedManifest = packAndReadManifest(
          dirname(packedManifestPath),
          packingRoot,
        );

        if (!comparePeerDependencies(sourceManifest, packedManifest)) {
          errors.push(
            `${projectConfig.name}: packed peerDependencies differ from the source manifest`,
          );
        }
      }
    }
  }

  results.push({
    projectName: projectConfig.name,
    visibility: isPublic ? 'public' : 'private',
    releaseGroups: groups.length > 0 ? groups.join(', ') : 'not published',
  });
}

if (packingRoot) {
  rmSync(packingRoot, { recursive: true, force: true });
}

if (errors.length > 0) {
  console.error('Angular package compatibility validation failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `Angular package compatibility validation passed for ${results.length} project(s).`,
);
for (const result of results.sort((left, right) =>
  left.projectName.localeCompare(right.projectName),
)) {
  console.log(
    `- ${result.projectName}: ${result.visibility}; ${result.releaseGroups}`,
  );
}

if (validatePackedManifests) {
  console.log(
    'Built and packed peer metadata matches every public source manifest.',
  );
}
