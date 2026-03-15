import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const workspaceRoot = process.cwd();
const libsRoot = join(workspaceRoot, 'libs');
const dependencySections = ['dependencies', 'peerDependencies'];
const exactVersionPattern = /^\d+\.\d+\.\d+$/;

const changedFiles = [];
const changedEntries = [];

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

function normalizePackageJson(packageJsonPath) {
  const source = readFileSync(packageJsonPath, 'utf8');
  const parsed = JSON.parse(source);
  let fileChanged = false;

  for (const sectionName of dependencySections) {
    const section = parsed[sectionName];
    if (!section || typeof section !== 'object') {
      continue;
    }

    for (const [dependencyName, version] of Object.entries(section)) {
      if (!dependencyName.startsWith('@anarchitects/')) {
        continue;
      }

      if (typeof version !== 'string' || !exactVersionPattern.test(version)) {
        continue;
      }

      section[dependencyName] = `^${version}`;
      fileChanged = true;
      changedEntries.push(
        `${relative(workspaceRoot, packageJsonPath)} :: ${sectionName}.${dependencyName} ${version} -> ^${version}`,
      );
    }
  }

  if (!fileChanged) {
    return;
  }

  writeFileSync(packageJsonPath, `${JSON.stringify(parsed, null, 2)}\n`);
  changedFiles.push(relative(workspaceRoot, packageJsonPath));
}

const packageJsonFiles = walkDirectories(libsRoot);
for (const packageJsonPath of packageJsonFiles) {
  normalizePackageJson(packageJsonPath);
}

if (changedFiles.length === 0) {
  console.log('No exact internal @anarchitects/* dependency versions found.');
  process.exit(0);
}

console.log('Updated package manifests:');
for (const file of changedFiles) {
  console.log(`- ${file}`);
}

console.log('Updated dependency entries:');
for (const entry of changedEntries) {
  console.log(`- ${entry}`);
}
