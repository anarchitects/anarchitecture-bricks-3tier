import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

import OpenApiDiff from 'openapi-diff';

const SPEC_PATH = join(process.cwd(), 'docs/openapi/openapi.yaml');

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

  const result = await OpenApiDiff.diffSpecs({
    sourceSpec: {
      content: source,
      location: `${baseRef}:docs/openapi/openapi.yaml`,
      format: 'openapi3',
    },
    destinationSpec: {
      content: destination,
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
