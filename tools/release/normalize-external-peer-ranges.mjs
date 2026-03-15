import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const workspaceRoot = process.cwd();
const libsRoot = join(workspaceRoot, 'libs');
const rootPackageJsonPath = join(workspaceRoot, 'package.json');
const exactSemverPattern = /^\d+\.\d+\.\d+$/;

const changedFiles = [];
const changedEntries = [];
const missingRootDependencyReferences = new Map();

const rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, 'utf8'));
const rootDependencyMap = {
  ...(rootPackageJson.dependencies ?? {}),
  ...(rootPackageJson.devDependencies ?? {}),
};

function walkDirectories(rootDir) {
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

      if (entry.isFile() && entry.name === 'package.json') {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function addMissingRootDependencyReference(dependencyName, packageJsonPath) {
  const relativePath = relative(workspaceRoot, packageJsonPath);
  const existing = missingRootDependencyReferences.get(dependencyName) ?? new Set();
  existing.add(relativePath);
  missingRootDependencyReferences.set(dependencyName, existing);
}

function getTargetRangeForPeer(dependencyName, packageJsonPath) {
  const rootRange = rootDependencyMap[dependencyName];
  if (!rootRange || typeof rootRange !== 'string') {
    addMissingRootDependencyReference(dependencyName, packageJsonPath);
    return null;
  }

  if (exactSemverPattern.test(rootRange)) {
    const [major] = rootRange.split('.');
    return `^${major}.0.0`;
  }

  return rootRange;
}

function normalizePackageJson(packageJsonPath) {
  const source = readFileSync(packageJsonPath, 'utf8');
  const parsed = JSON.parse(source);
  const peerDependencies = parsed.peerDependencies;

  if (!parsed.publishConfig || !peerDependencies || typeof peerDependencies !== 'object') {
    return;
  }

  let fileChanged = false;

  for (const [dependencyName, currentRange] of Object.entries(peerDependencies)) {
    if (dependencyName.startsWith('@anarchitects/')) {
      continue;
    }

    const targetRange = getTargetRangeForPeer(dependencyName, packageJsonPath);
    if (!targetRange || currentRange === targetRange) {
      continue;
    }

    peerDependencies[dependencyName] = targetRange;
    fileChanged = true;
    changedEntries.push(
      `${relative(workspaceRoot, packageJsonPath)} :: peerDependencies.${dependencyName} ${currentRange} -> ${targetRange}`,
    );
  }

  if (!fileChanged) {
    return;
  }

  writeFileSync(packageJsonPath, `${JSON.stringify(parsed, null, 2)}\n`);
  changedFiles.push(relative(workspaceRoot, packageJsonPath));
}

for (const packageJsonPath of walkDirectories(libsRoot)) {
  normalizePackageJson(packageJsonPath);
}

if (changedFiles.length === 0) {
  console.log('No external peer dependency ranges required normalization.');
} else {
  console.log('Updated package manifests:');
  for (const file of changedFiles) {
    console.log(`- ${file}`);
  }

  console.log('Updated peer dependency entries:');
  for (const entry of changedEntries) {
    console.log(`- ${entry}`);
  }
}

if (missingRootDependencyReferences.size > 0) {
  console.warn(
    'Skipped peer dependencies without root package.json mapping (left unchanged):',
  );

  const sortedMissing = [...missingRootDependencyReferences.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  for (const [dependencyName, fileSet] of sortedMissing) {
    console.warn(`- ${dependencyName}`);
    for (const file of [...fileSet].sort()) {
      console.warn(`  - ${file}`);
    }
  }
}
