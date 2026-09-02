import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';

const workspaceRoot = process.cwd();
const expectedNodeRange = '^20.19.0 || ^22.13.0 || >=24.11.0';
const projects = [
  {
    name: 'auth-nest',
    root: 'libs/auth/nest',
    expectedPeers: {
      '@nestjs/common': '^11.0.0',
      '@nestjs/config': '^4.0.2',
      '@nestjs/core': '^11.0.0',
      '@nestjs/jwt': '^11.0.1',
      '@nestjs/platform-fastify': '^11.1.6',
      '@nestjs/typeorm': '^11.0.1',
      typeorm: '^1.1.0',
    },
    expectedDependencies: {
      '@anarchitects/better-auth-typeorm-adapter': '0.2.0',
      '@better-auth/core': '1.7.2',
      '@better-auth/passkey': '~1.7.2',
      '@better-auth/utils': '0.4.2',
      '@better-fetch/fetch': '1.3.1',
      'better-auth': '~1.7.2',
      'better-call': '1.4.0',
      jose: '^6.2.3',
      kysely: '^0.29.0',
      nanostores: '^1.3.0',
    },
    expectedExport: './infrastructure-persistence',
    requiredFiles: [
      'src/infrastructure-persistence/migrations/1788275931000-add-better-auth-account-issuer.js',
      'src/infrastructure-persistence/migrations/1788275931000-add-better-auth-account-issuer.d.ts',
    ],
  },
  {
    name: 'forms-nest',
    root: 'libs/forms/nest',
    expectedPeers: {
      '@nestjs/common': '^11.0.0',
      '@nestjs/config': '^4.0.2',
      '@nestjs/platform-fastify': '^11.1.6',
      '@nestjs/typeorm': '^11.0.1',
      typeorm: '^1.1.0',
    },
    expectedExport: './infrastructure-persistence',
    requiredFiles: [],
  },
  {
    name: 'identity-nest',
    root: 'libs/identity/nest',
    expectedPeers: {
      '@nestjs/common': '^11.0.0',
      '@nestjs/config': '^4.0.2',
      '@nestjs/platform-fastify': '^11.1.6',
      '@nestjs/typeorm': '^11.0.1',
      typeorm: '^1.1.0',
    },
    expectedExport: './infrastructure-persistence',
    requiredFiles: [],
  },
];

const errors = [];
const packingRoot = mkdtempSync(
  join(tmpdir(), 'anarchitects-typeorm-package-packs-'),
);

try {
  for (const project of projects) {
    validateProject(project);
  }
} finally {
  rmSync(packingRoot, { recursive: true, force: true });
}

if (errors.length > 0) {
  console.error('TypeORM package compatibility validation failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `TypeORM package compatibility validation passed for ${projects.length} package(s).`,
);
for (const project of projects) {
  console.log(`- ${project.name}: TypeORM ^1.1.0; Node ${expectedNodeRange}`);
}

function validateProject(project) {
  const sourceManifestPath = join(workspaceRoot, project.root, 'package.json');
  const builtManifestPath = join(
    workspaceRoot,
    'dist',
    project.root,
    'package.json',
  );
  const sourceManifest = readJson(sourceManifestPath);
  const builtManifest = readJson(builtManifestPath);
  const packResult = packProject(dirname(builtManifestPath));
  const packedManifest = readPackedManifest(packResult.archivePath);

  for (const [name, range] of Object.entries(project.expectedPeers)) {
    assertEqual(
      sourceManifest.peerDependencies?.[name],
      range,
      `${project.name}: source peer ${name}`,
    );
  }

  for (const [name, range] of Object.entries(
    project.expectedDependencies ?? {},
  )) {
    assertEqual(
      sourceManifest.dependencies?.[name],
      range,
      `${project.name}: source dependency ${name}`,
    );
  }

  assertEqual(
    sourceManifest.engines?.node,
    expectedNodeRange,
    `${project.name}: source Node engine`,
  );
  assertJsonEqual(
    builtManifest.peerDependencies,
    sourceManifest.peerDependencies,
    `${project.name}: built peerDependencies`,
  );
  assertJsonEqual(
    builtManifest.dependencies,
    sourceManifest.dependencies,
    `${project.name}: built dependencies`,
  );
  assertJsonEqual(
    builtManifest.engines,
    sourceManifest.engines,
    `${project.name}: built engines`,
  );
  assertJsonEqual(
    packedManifest.peerDependencies,
    sourceManifest.peerDependencies,
    `${project.name}: packed peerDependencies`,
  );
  assertJsonEqual(
    packedManifest.dependencies,
    sourceManifest.dependencies,
    `${project.name}: packed dependencies`,
  );
  assertJsonEqual(
    packedManifest.engines,
    sourceManifest.engines,
    `${project.name}: packed engines`,
  );

  if (!packedManifest.exports?.[project.expectedExport]) {
    errors.push(
      `${project.name}: packed manifest is missing ${project.expectedExport} export`,
    );
  }

  const packedFiles = new Set(packResult.files);
  for (const requiredFile of project.requiredFiles) {
    if (!packedFiles.has(requiredFile)) {
      errors.push(`${project.name}: packed tarball is missing ${requiredFile}`);
    }
  }
}

function packProject(projectRoot) {
  const tarballDirectory = join(packingRoot, 'tarballs');
  const npmCacheDirectory = join(packingRoot, 'npm-cache');
  mkdirSync(tarballDirectory, { recursive: true });

  const result = JSON.parse(
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
  )[0];

  return {
    archivePath: join(tarballDirectory, result.filename),
    files: result.files.map((file) => file.path),
  };
}

function readPackedManifest(archivePath) {
  return JSON.parse(
    execFileSync('tar', ['-xOf', archivePath, 'package/package.json'], {
      encoding: 'utf8',
    }),
  );
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(
      `Unable to read ${relative(workspaceRoot, filePath)}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    errors.push(`${label} expected ${expected}, received ${String(actual)}`);
  }
}

function assertJsonEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    errors.push(`${label} differs from the source manifest`);
  }
}
