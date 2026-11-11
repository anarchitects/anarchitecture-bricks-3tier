import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const workspaceRoot = process.cwd();
const libsRoot = join(workspaceRoot, 'libs');

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

function parseOptions(argv) {
  const selected = new Set();
  let requireTags = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--require-tags') {
      requireTags = true;
      continue;
    }

    let value;
    if (arg === '--projects') {
      value = argv[++index];
    } else if (arg.startsWith('--projects=')) {
      value = arg.slice('--projects='.length);
    } else {
      throw new Error(`Unsupported argument "${arg}".`);
    }

    if (
      !value ||
      value.startsWith('-') ||
      value.split(',').some((name) => !name.trim())
    ) {
      throw new Error(
        '--projects requires a non-empty comma-separated project list.',
      );
    }
    for (const project of value.split(',')) {
      selected.add(project.trim());
    }
  }

  return { selectedProjects: selected, requireTags };
}

function checkedGit(args) {
  const result = runGit(args);
  if (result.status !== 0) {
    throw new Error(
      `Git ${args[0]} failed: ${result.error?.message || result.stderr.trim() || `exit ${result.status}`}`,
    );
  }
  return result.stdout.trim();
}

function isPublishableProject(packageJson) {
  return Boolean(
    packageJson &&
      typeof packageJson === 'object' &&
      packageJson.publishConfig &&
      typeof packageJson.version === 'string',
  );
}

function main() {
  const { selectedProjects, requireTags } = parseOptions(process.argv.slice(2));
  const head = checkedGit(['rev-parse', '--verify', 'HEAD^{commit}']);
  if (checkedGit(['rev-parse', '--is-shallow-repository']) !== 'false') {
    throw new Error(
      'Full Git history is required. Fetch the branch history and release tags before retrying.',
    );
  }
  const existingTags = new Set(
    checkedGit(['for-each-ref', '--format=%(refname)', 'refs/tags/']).split(
      '\n',
    ),
  );
  const projectJsonFiles = walkDirectories(libsRoot, 'project.json');
  const projects = new Map();

  for (const projectJsonPath of projectJsonFiles) {
    const projectDir = join(projectJsonPath, '..');
    const packageJsonPath = join(projectDir, 'package.json');

    if (!existsSync(packageJsonPath)) {
      continue;
    }

    const projectJson = JSON.parse(readFileSync(projectJsonPath, 'utf8'));
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const projectName = projectJson.name;

    if (typeof projectName !== 'string' || !isPublishableProject(packageJson)) {
      continue;
    }

    if (projects.has(projectName)) {
      throw new Error(`Duplicate publishable project "${projectName}".`);
    }
    projects.set(projectName, {
      version: packageJson.version,
      projectJsonPath,
    });
  }

  for (const projectName of selectedProjects) {
    if (!projects.has(projectName)) {
      throw new Error(`Unknown or non-publishable project "${projectName}".`);
    }
  }
  const names =
    selectedProjects.size > 0 ? [...selectedProjects] : [...projects.keys()];
  if (names.length === 0) throw new Error('No publishable projects found.');

  const mismatches = [];
  const missingTags = [];
  let checkedTags = 0;
  for (const projectName of names) {
    const { version, projectJsonPath } = projects.get(projectName);
    const tagName = `${projectName}@${version}`;
    const tagRef = `refs/tags/${tagName}`;
    checkedGit(['check-ref-format', tagRef]);

    if (!existingTags.has(tagRef)) {
      missingTags.push(tagName);
      continue;
    }

    // An existing broken/non-commit tag is never an initial release.
    const tagCommit = checkedGit([
      'rev-parse',
      '--verify',
      `${tagRef}^{commit}`,
    ]);
    checkedTags += 1;

    const ancestry = runGit(['merge-base', '--is-ancestor', tagCommit, head]);
    if (ancestry.status !== 0 && ancestry.status !== 1) {
      throw new Error(
        `Unable to check ancestry for ${tagName}: ${ancestry.error?.message || ancestry.stderr.trim()}`,
      );
    }
    if (ancestry.status === 1) {
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

    throw new Error(
      'Use the correct release branch and fetched history. Never move or rewrite published release tags to bypass this check.',
    );
  }

  if (missingTags.length > 0) {
    const message = `Missing release tags: ${missingTags.join(', ')}.`;
    if (requireTags)
      throw new Error(
        `${message} Fetch release tags or review the baseline; --require-tags forbids initial releases.`,
      );
    console.log(
      `${message} Not checked for ancestry; the release runner must separately authorize any first release.`,
    );
  }
  console.log(
    `Release tag ancestry preflight passed for ${checkedTags} tag(s) across ${names.length} selected project(s) at ${head}.`,
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
