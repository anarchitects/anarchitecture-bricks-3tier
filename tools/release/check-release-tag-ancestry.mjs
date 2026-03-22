import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const workspaceRoot = process.cwd();
const libsRoot = join(workspaceRoot, 'libs');
const selectedProjects = parseSelectedProjects(process.argv.slice(2));

function walkDirectories(rootDir, fileName) {
  const stack = [rootDir];
  const files = [];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(current, entry.name);

      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name === fileName) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function runGit(args) {
  return spawnSync('git', args, { cwd: workspaceRoot, encoding: 'utf8' });
}

function parseSelectedProjects(argv) {
  const selected = new Set();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--projects') {
      const value = argv[index + 1];
      if (typeof value === 'string') {
        for (const project of value.split(',')) {
          const trimmed = project.trim();
          if (trimmed) {
            selected.add(trimmed);
          }
        }
      }
      index += 1;
      continue;
    }

    if (!arg.startsWith('--projects=')) {
      continue;
    }

    const value = arg.slice('--projects='.length);
    for (const project of value.split(',')) {
      const trimmed = project.trim();
      if (trimmed) {
        selected.add(trimmed);
      }
    }
  }

  return selected;
}

function resolveTagCommit(tagName) {
  const result = runGit(['rev-parse', '--verify', '--quiet', `refs/tags/${tagName}^{commit}`]);
  if (result.status !== 0) {
    return null;
  }

  return result.stdout.trim();
}

function isAncestor(commitHash) {
  const result = runGit(['merge-base', '--is-ancestor', commitHash, 'HEAD']);
  return result.status === 0;
}

function isPublishableProject(projectDir, packageJson) {
  return Boolean(
    packageJson &&
      typeof packageJson === 'object' &&
      packageJson.publishConfig &&
      typeof packageJson.version === 'string',
  );
}

const projectJsonFiles = walkDirectories(libsRoot, 'project.json');
const mismatches = [];
let checkedTags = 0;

for (const projectJsonPath of projectJsonFiles) {
  const projectDir = join(projectJsonPath, '..');
  const packageJsonPath = join(projectDir, 'package.json');

  if (!existsSync(packageJsonPath)) {
    continue;
  }

  const projectJson = JSON.parse(readFileSync(projectJsonPath, 'utf8'));
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const projectName = projectJson.name;

  if (typeof projectName !== 'string' || !isPublishableProject(projectDir, packageJson)) {
    continue;
  }

  if (selectedProjects.size > 0 && !selectedProjects.has(projectName)) {
    continue;
  }

  const version = packageJson.version;
  const tagName = `${projectName}@${version}`;
  const tagCommit = resolveTagCommit(tagName);

  if (!tagCommit) {
    continue;
  }

  checkedTags += 1;

  if (!isAncestor(tagCommit)) {
    mismatches.push({
      projectName,
      version,
      tagName,
      tagCommit,
      projectJsonPath: relative(workspaceRoot, projectJsonPath),
    });
  }
}

if (mismatches.length > 0) {
  console.error('Release tag ancestry preflight failed.');
  console.error(
    'The following project tag(s) exist but point to commits outside the current branch history:',
  );

  for (const mismatch of mismatches) {
    console.error(
      `- ${mismatch.tagName} (${mismatch.tagCommit}) [${mismatch.projectJsonPath}]`,
    );
  }

  console.error(
    'Fix by moving each tag to the intended reachable release baseline before running nx release.',
  );
  process.exit(1);
}

console.log(
  `Release tag ancestry preflight passed for ${checkedTags} tag(s) that match current project versions.`,
);
