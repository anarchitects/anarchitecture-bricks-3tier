import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

type OpenApiDocument = {
  paths?: Record<string, Record<string, { operationId?: string }>>;
};

type SnapshotDocument = {
  paths: Record<string, Record<string, string>>;
};

const OPENAPI_PATH = join(process.cwd(), 'docs/openapi/openapi.json');
const SNAPSHOT_PATH = join(
  process.cwd(),
  'tools/api-specs/openapi.snapshot.json',
);
const WORKSPACE_ROOT = process.cwd();

const REQUIRED_PATHS: Array<{ path: string; methods: string[] }> = [
  { path: '/auth/register', methods: ['post'] },
  { path: '/auth/login', methods: ['post'] },
  { path: '/auth/me', methods: ['get'] },
  { path: '/forms/{formId}', methods: ['get'] },
  { path: '/forms/submit', methods: ['post'] },
];

function readOpenApi(): OpenApiDocument {
  return JSON.parse(readFileSync(OPENAPI_PATH, 'utf8')) as OpenApiDocument;
}

function readSnapshot(): SnapshotDocument {
  return JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8')) as SnapshotDocument;
}

function summarizePaths(
  document: OpenApiDocument,
): Record<string, Record<string, string>> {
  const output: Record<string, Record<string, string>> = {};
  const paths = document.paths ?? {};

  for (const [pathName, methods] of Object.entries(paths).sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    output[pathName] = {};

    for (const [method, operation] of Object.entries(methods).sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      output[pathName][method] =
        operation.operationId ?? 'missing-operation-id';
    }
  }

  return output;
}

function assertRequiredPaths(document: OpenApiDocument) {
  const paths = document.paths ?? {};
  const errors: string[] = [];

  for (const required of REQUIRED_PATHS) {
    const methods = paths[required.path];

    if (!methods) {
      errors.push(`Missing required path: ${required.path}`);
      continue;
    }

    for (const method of required.methods) {
      if (!methods[method]) {
        errors.push(
          `Missing required method: ${method.toUpperCase()} ${required.path}`,
        );
      }
    }
  }

  return errors;
}

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
  const openApi = readOpenApi();
  const snapshot = readSnapshot();
  const currentSummary = summarizePaths(openApi);

  const errors = [
    ...assertRequiredPaths(openApi),
    ...assertControllerSchemaPurity(findNestControllerFiles()),
  ];

  if (JSON.stringify(snapshot.paths) !== JSON.stringify(currentSummary)) {
    errors.push(
      'OpenAPI snapshot mismatch. Run `nx run api-specs:snapshot` after intentional API changes.',
    );
  }

  if (errors.length > 0) {
    console.error('OpenAPI verification failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('OpenAPI verification checks passed.');
}

run();
