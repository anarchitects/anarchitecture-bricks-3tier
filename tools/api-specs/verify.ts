import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import {
  loadCanonicalArtifacts,
  compareOperationInventory,
  comparisonReport,
} from './canonical-artifacts.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const WORKSPACE_ROOT = process.cwd();

function listFilesRecursive(rootPath: string): string[] {
  try {
    const entries = readdirSync(rootPath, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = join(rootPath, entry.name);

      if (entry.isDirectory()) {
        files.push(...listFilesRecursive(fullPath));
        continue;
      }

      files.push(fullPath);
    }

    return files;
  } catch {
    return [];
  }
}

function findNestControllerFiles(): string[] {
  const files = [
    ...listFilesRecursive(join(WORKSPACE_ROOT, 'libs')),
    ...listFilesRecursive(join(WORKSPACE_ROOT, 'examples')),
  ];

  return files.filter((filePath) => {
    if (!filePath.endsWith('.ts')) {
      return false;
    }

    if (filePath.endsWith('.spec.ts') || filePath.endsWith('.test.ts')) {
      return false;
    }

    const normalizedPath = filePath.replace(/\\/g, '/');

    return (
      normalizedPath.includes('/nest/src/presentation/controllers/') ||
      (normalizedPath.includes('/nest/src/presentation/') &&
        normalizedPath.endsWith('.controller.ts')) ||
      (normalizedPath.includes('/examples/') &&
        normalizedPath.endsWith('.controller.ts'))
    );
  });
}

function assertControllerSchemaPurity(controllerFiles: string[]) {
  const errors: string[] = [];

  const typeboxImportPattern =
    /\b(?:import|export)\b[\s\S]*?['"]@sinclair\/typebox['"]/m;
  const inlineTypeSchemaPattern =
    /\b(?:const|let|var|export\s+const)\s+\w+Schema\s*=\s*Type\./;
  const routeSchemaBlockPattern = /@RouteSchema\s*\(\s*\{[\s\S]*?\}\s*\)/g;
  const operationIdPattern = /(^|[\s,{])operationId\s*:/m;
  const tagsPattern = /(^|[\s,{])tags\s*:/m;

  for (const filePath of controllerFiles) {
    const source = readFileSync(filePath, 'utf8');
    const relativePath = relative(WORKSPACE_ROOT, filePath).replace(/\\/g, '/');

    if (typeboxImportPattern.test(source)) {
      errors.push(
        `Controller must not import @sinclair/typebox directly: ${relativePath}`,
      );
    }

    if (inlineTypeSchemaPattern.test(source)) {
      errors.push(
        `Controller must not declare inline TypeBox schemas: ${relativePath}`,
      );
    }

    const routeSchemaBlocks = source.match(routeSchemaBlockPattern) ?? [];
    for (const block of routeSchemaBlocks) {
      if (operationIdPattern.test(block)) {
        errors.push(
          `Controller RouteSchema must not set operationId directly: ${relativePath}`,
        );
      }

      if (tagsPattern.test(block)) {
        errors.push(
          `Controller RouteSchema must not set tags directly: ${relativePath}`,
        );
      }
    }
  }

  return errors;
}

function run() {
  const openApi = JSON.parse(readFileSync('docs/openapi/openapi.json', 'utf8'));
  const artifacts = loadCanonicalArtifacts();
  const report = comparisonReport(openApi, artifacts);
  mkdirSync('dist/api-conformance', { recursive: true });
  writeFileSync(
    'dist/api-conformance/openapi-comparison.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  const errors = [
    ...compareOperationInventory(openApi, artifacts),
    ...assertControllerSchemaPurity(findNestControllerFiles()),
  ];

  if (errors.length > 0) {
    console.error('OpenAPI verification failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(
    'Canonical route inventory and controller purity passed. Structural differences and unresolved host obligations: dist/api-conformance/openapi-comparison.json. This is not a full host-conformance claim.',
  );
}

run();
