import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const workspaceRoot = process.cwd();
const libsRoot = join(workspaceRoot, 'libs');
const outputDir = join(workspaceRoot, 'dist/docs-hub/data');
const outputFile = join(outputDir, 'packages.catalog.json');

function walkFiles(rootDir, targetName) {
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
      if (entry.isFile() && entry.name === targetName) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function runGit(args) {
  return spawnSync('git', args, { cwd: workspaceRoot, encoding: 'utf8' });
}

function normalizeRepoWebUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }

  const trimmed = rawUrl.trim();
  const sshMatch = /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/.exec(trimmed);
  if (sshMatch) {
    return `https://github.com/${sshMatch[1]}/${sshMatch[2]}`;
  }

  const httpsMatch = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/.exec(trimmed);
  if (httpsMatch) {
    return `https://github.com/${httpsMatch[1]}/${httpsMatch[2]}`;
  }

  return null;
}

function detectDomain(relativePackagePath) {
  const segments = relativePackagePath.split('/');
  if (segments[0] !== 'libs' || segments.length < 2) {
    return 'unknown';
  }

  const primary = segments[1];
  if (primary === 'ts') {
    return 'ts';
  }

  return primary;
}

function detectTech(relativePackagePath) {
  const segments = relativePackagePath.split('/');
  if (segments.includes('angular')) {
    return 'angular';
  }
  if (segments.includes('nest')) {
    return 'nest';
  }
  if (segments.includes('ts')) {
    return 'ts';
  }
  return 'other';
}

const remoteResult = runGit(['remote', 'get-url', 'origin']);
const repoWebUrl =
  remoteResult.status === 0 ? normalizeRepoWebUrl(remoteResult.stdout) : null;

const packageFiles = walkFiles(libsRoot, 'package.json');
const packages = [];

for (const packageFile of packageFiles) {
  const packageDir = join(packageFile, '..');
  const readmePath = join(packageDir, 'README.md');
  const relativePackagePath = relative(workspaceRoot, packageFile).replaceAll('\\', '/');
  const relativePackageDir = relative(workspaceRoot, packageDir).replaceAll('\\', '/');
  const relativeReadmePath = relative(workspaceRoot, readmePath).replaceAll('\\', '/');

  const packageJson = JSON.parse(readFileSync(packageFile, 'utf8'));
  const importPath =
    typeof packageJson.name === 'string' && packageJson.name.length > 0
      ? packageJson.name
      : relativePackageDir;

  const catalogEntry = {
    importPath,
    version: typeof packageJson.version === 'string' ? packageJson.version : '0.0.0',
    packageJsonPath: relativePackagePath,
    packageDir: relativePackageDir,
    readmePath: existsSync(readmePath) ? relativeReadmePath : null,
    readmeUrl:
      existsSync(readmePath) && repoWebUrl
        ? `${repoWebUrl}/blob/main/${relativeReadmePath}`
        : null,
    domain: detectDomain(relativePackagePath),
    tech: detectTech(relativePackagePath),
    publishable: Boolean(packageJson.publishConfig),
  };

  packages.push(catalogEntry);
}

packages.sort((left, right) => left.importPath.localeCompare(right.importPath));

mkdirSync(outputDir, { recursive: true });
writeFileSync(
  outputFile,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      packageCount: packages.length,
      repoWebUrl,
      packages,
    },
    null,
    2,
  )}\n`,
);

console.log(
  `Docs hub package catalog generated at ${outputFile} (${packages.length} package entries).`,
);
