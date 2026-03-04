import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type OpenApiDocument = {
  openapi?: string;
  info?: {
    title?: string;
    version?: string;
  };
  paths?: Record<string, Record<string, { operationId?: string }>>;
};

const OPENAPI_PATH = join(process.cwd(), 'docs/openapi/openapi.json');
const SNAPSHOT_PATH = join(process.cwd(), 'tools/api-specs/openapi.snapshot.json');

function readOpenApi(): OpenApiDocument {
  return JSON.parse(readFileSync(OPENAPI_PATH, 'utf8')) as OpenApiDocument;
}

function summarizePaths(document: OpenApiDocument): Record<string, Record<string, string>> {
  const output: Record<string, Record<string, string>> = {};
  const paths = document.paths ?? {};

  for (const [pathName, methods] of Object.entries(paths).sort((a, b) => a[0].localeCompare(b[0]))) {
    output[pathName] = {};

    for (const [method, operation] of Object.entries(methods).sort((a, b) => a[0].localeCompare(b[0]))) {
      output[pathName][method] = operation.operationId ?? 'missing-operation-id';
    }
  }

  return output;
}

function run() {
  const openApi = readOpenApi();
  const snapshot = {
    openapi: openApi.openapi ?? 'missing',
    title: openApi.info?.title ?? 'missing',
    version: openApi.info?.version ?? 'missing',
    paths: summarizePaths(openApi),
  };

  writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Updated API snapshot at ${SNAPSHOT_PATH}`);
}

run();
