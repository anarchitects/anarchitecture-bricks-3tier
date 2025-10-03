import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import OpenApiDiff from 'openapi-diff';

type DiffOutcome = Awaited<ReturnType<typeof OpenApiDiff.diffSpecs>>;

type Summary = {
  label: string;
  items: Array<{ action: string; entity: string; location: string; type: string }>;
};

const SPEC_PATH = join(process.cwd(), 'contracts/openapi.yaml');

function resolveBaseSpec(ref: string): string {
  try {
    return execSync(`git show ${ref}:contracts/openapi.yaml`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to load contracts/openapi.yaml from ref "${ref}". Ensure the ref exists and the file is tracked.\n${message}`,
    );
  }
}

function buildSummary(outcome: DiffOutcome): Summary[] {
  const parts: Summary[] = [];

  const add = (
    label: string,
    items:
      | Array<{
          action: string;
          entity: string;
          destinationSpecEntityDetails?: Array<{ location: string }>;
          sourceSpecEntityDetails?: Array<{ location: string }>;
          type: string;
        }>
      | undefined,
  ) => {
    if (!items || items.length === 0) return;
    parts.push({
      label,
      items: items.map((item) => ({
        action: item.action,
        entity: item.entity,
        location: item.destinationSpecEntityDetails?.[0]?.location ?? item.sourceSpecEntityDetails?.[0]?.location ?? 'unknown',
        type: item.type,
      })),
    });
  };

  if ('breakingDifferences' in outcome) {
    add('Breaking differences', outcome.breakingDifferences);
  }

  add('Non-breaking differences', outcome.nonBreakingDifferences);
  add('Unclassified differences', outcome.unclassifiedDifferences);

  return parts;
}

function printSummary(summaries: Summary[]) {
  for (const summary of summaries) {
    console.log(`\n${summary.label}: ${summary.items.length}`);
    for (const item of summary.items) {
      const location = item.location === undefined ? '' : ` @ ${item.location}`;
      console.log(`  - [${item.type}] ${item.entity} ${item.action}${location}`);
    }
  }
}

async function run() {
  const [, , maybeRef] = process.argv;
  const baseRef = maybeRef ?? 'origin/main';

  const destination = readFileSync(SPEC_PATH, 'utf8');
  const source = resolveBaseSpec(baseRef);

  const outcome = await OpenApiDiff.diffSpecs({
    sourceSpec: { content: source, location: `${baseRef}:contracts/openapi.yaml`, format: 'openapi3' },
    destinationSpec: { content: destination, location: 'workspace/contracts/openapi.yaml', format: 'openapi3' },
  });

  const summaries = buildSummary(outcome);

  if (summaries.length === 0) {
    console.log(`No differences found between ${baseRef} and working tree.`);
    return;
  }

  printSummary(summaries);

  const hasBreaking = 'breakingDifferencesFound' in outcome && outcome.breakingDifferencesFound === true;
  const hasOtherChanges = summaries.some((summary) => summary.items.length > 0);

  if (hasBreaking || hasOtherChanges) {
    console.error('\nContract diff detected differences. Failing as per policy.');
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
