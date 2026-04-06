import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

import OpenApiDiff from 'openapi-diff';

const SPEC_PATH = join(process.cwd(), 'docs/openapi/openapi.yaml');
const OPENAPI_31_REGEX = /^openapi:\s*["']?3\.1\.\d+["']?\s*$/m;

function normalizeSpecForDiff(content: string, label: string): string {
  if (!OPENAPI_31_REGEX.test(content)) {
    return content;
  }

  console.log(
    `Normalizing ${label} OpenAPI version from 3.1.x to 3.0.3 for openapi-diff compatibility.`,
  );

  return content.replace(OPENAPI_31_REGEX, 'openapi: 3.0.3');
}

function loadCurrentSpec(): string {
  return readFileSync(SPEC_PATH, 'utf8');
}

function loadSpecFromRef(ref: string): string | null {
  try {
    return execSync(`git show ${ref}:docs/openapi/openapi.yaml`, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    }).toString('utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('exists on disk, but not in')) {
      return null;
    }

    throw new Error(
      `Failed to load docs/openapi/openapi.yaml from ref "${ref}".\n${message}`,
    );
  }
}

async function run() {
  const baseRef = process.argv[2] ?? 'origin/main';
  const source = loadSpecFromRef(baseRef);
  if (!source) {
    console.log(
      `Skipped OpenAPI diff: docs/openapi/openapi.yaml not found at ${baseRef}.`,
    );
    return;
  }

  const destination = loadCurrentSpec();
  const normalizedSource = normalizeSpecForDiff(source, `${baseRef} spec`);
  const normalizedDestination = normalizeSpecForDiff(
    destination,
    'workspace spec',
  );

  const result = await OpenApiDiff.diffSpecs({
    sourceSpec: {
      content: normalizedSource,
      location: `${baseRef}:docs/openapi/openapi.yaml`,
      format: 'openapi3',
    },
    destinationSpec: {
      content: normalizedDestination,
      location: 'workspace/docs/openapi/openapi.yaml',
      format: 'openapi3',
    },
  });

  const changedOperations = result.breakingDifferencesFound
    ? result.breakingDifferences.length
    : 0;

  console.log(`Compared OpenAPI spec against ${baseRef}.`);
  console.log(
    `Breaking changes: ${result.breakingDifferencesFound ? 'YES' : 'NO'}${
      result.breakingDifferencesFound
        ? ` (${changedOperations} difference${
            changedOperations === 1 ? '' : 's'
          })`
        : ''
    }`,
  );

  if (result.breakingDifferencesFound) {
    for (const difference of result.breakingDifferences) {
      const [destinationDetail] = difference.destinationSpecEntityDetails ?? [];
      console.log(
        `- ${difference.action} @ ${destinationDetail?.location ?? 'unknown location'}`,
      );
    }
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error('OpenAPI diff failed.');
  console.error(error);
  process.exit(1);
});
