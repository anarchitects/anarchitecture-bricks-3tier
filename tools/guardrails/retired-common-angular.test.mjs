import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();
const retiredProjects = [
  {
    name: 'common-angular-design',
    packageName: '@anarchitects/common-angular-design',
    root: 'libs/common/angular/design',
  },
  {
    name: 'common-angular-ui-composition',
    packageName: '@anarchitects/common-angular-ui-composition',
    root: 'libs/common/angular/ui-composition',
  },
  {
    name: 'common-angular-ui-layouts',
    packageName: '@anarchitects/common-angular-ui-layouts',
    root: 'libs/common/angular/ui-layouts',
  },
  {
    name: 'common-angular-ui-primitives',
    packageName: '@anarchitects/common-angular-ui-primitives',
    root: 'libs/common/angular/ui-primitives',
  },
];

function walkFiles(root, predicate) {
  if (!existsSync(root)) {
    return [];
  }

  const files = [];
  const stack = [root];
  while (stack.length > 0) {
    const directory = stack.pop();
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        stack.push(path);
      } else if (entry.isFile() && predicate(path)) {
        files.push(path);
      }
    }
  }
  return files;
}

test('retired Common Angular source projects stay removed', () => {
  for (const project of retiredProjects) {
    assert.equal(
      existsSync(join(workspaceRoot, project.root)),
      false,
      `${project.root} must not be recreated`,
    );
  }
});

test('workspace packages and examples do not depend on retired packages', () => {
  const manifestPaths = [
    join(workspaceRoot, 'package.json'),
    ...walkFiles(join(workspaceRoot, 'libs'), (path) =>
      path.endsWith('/package.json'),
    ),
    ...walkFiles(join(workspaceRoot, 'examples'), (path) =>
      path.endsWith('/package.json'),
    ),
  ];

  for (const manifestPath of manifestPaths) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const declaredDependencies = {
      ...manifest.dependencies,
      ...manifest.devDependencies,
      ...manifest.peerDependencies,
      ...manifest.optionalDependencies,
    };
    for (const project of retiredProjects) {
      assert.equal(
        declaredDependencies[project.packageName],
        undefined,
        `${manifestPath} must not declare ${project.packageName}`,
      );
    }
  }
});

test('workspace source does not import retired packages', () => {
  const sourceFiles = [
    ...walkFiles(join(workspaceRoot, 'libs'), (path) =>
      /\.(?:ts|mts|cts|js|mjs|cjs|html|css)$/.test(path),
    ),
    ...walkFiles(join(workspaceRoot, 'examples'), (path) =>
      /\.(?:ts|mts|cts|js|mjs|cjs|html|css)$/.test(path),
    ),
  ];

  for (const sourceFile of sourceFiles) {
    const source = readFileSync(sourceFile, 'utf8');
    for (const project of retiredProjects) {
      assert.equal(
        source.includes(project.packageName),
        false,
        `${sourceFile} must not import ${project.packageName}`,
      );
    }
  }
});

test('live Nx, release, docs, and compatibility configuration has no retired project references', () => {
  const liveConfiguration = [
    'nx.json',
    '.github/workflows/release.yml',
    'tools/release/project.json',
    'tools/angular-docs/project.json',
    'tools/angular-compatibility/project.json',
    'tools/angular-compatibility/run-packaged-consumer.mjs',
  ];

  for (const relativePath of liveConfiguration) {
    const source = readFileSync(join(workspaceRoot, relativePath), 'utf8');
    for (const project of retiredProjects) {
      assert.equal(
        source.includes(project.name) || source.includes(project.root),
        false,
        `${relativePath} must not reference retired project ${project.name}`,
      );
    }
  }
});
