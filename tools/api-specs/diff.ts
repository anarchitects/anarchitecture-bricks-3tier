import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import {
  digest,
  json,
  loadCanonicalArtifacts,
} from './canonical-artifacts.mjs';
import {
  gitJson,
  implementationChanges,
  wireOperations,
  assertCompatibilityReview,
} from './compatibility.mjs';

const baseRef =
  process.env['GITHUB_BASE_SHA'] ??
  process.env['NX_BASE'] ??
  process.argv[2] ??
  'origin/main';
const base = execFileSync(
  'git',
  ['rev-parse', '--verify', `${baseRef}^{commit}`],
  { encoding: 'utf8' },
).trim();
const artifacts = loadCanonicalArtifacts();
const current = JSON.parse(readFileSync('docs/openapi/openapi.json', 'utf8'));
const previous = gitJson(base, 'docs/openapi/openapi.json');
const changes = implementationChanges(previous, current, artifacts);
const report = {
  base,
  before: digest(json(wireOperations(previous))),
  after: digest(json(wireOperations(current))),
  canonical: artifacts.map(({ name, version, manifest }) => ({
    name,
    version,
    artifacts: manifest.artifacts,
  })),
  changes,
};
mkdirSync('dist/api-conformance', { recursive: true });
writeFileSync(
  'dist/api-conformance/compatibility.json',
  `${JSON.stringify(report, null, 2)}\n`,
);
const breaking = changes.filter(({ impact }) => impact === 'review-required');
if (breaking.length) {
  // A local snapshot or a bigger package version cannot approve wire changes.
  // Approval records bind the exact candidate, upstream version and comparison.
  const reviewPath = 'tools/api-specs/compatibility-review.json';
  let review;
  try {
    review = JSON.parse(readFileSync(reviewPath, 'utf8'));
  } catch {
    /* No review is not approval. */
  }
  const fingerprint = digest(json(report));
  try {
    assertCompatibilityReview(review, fingerprint);
  } catch {
    throw new Error(
      `Wire changes require human/upstream compatibility review (${fingerprint}). See dist/api-conformance/compatibility.json; record the exact approved comparison, decision, owner, migration and rollback in ${reviewPath}.`,
    );
  }
}
console.log(
  `OpenAPI 3.1 implementation comparison: ${changes.length} changes; ${breaking.length} reviewed wire changes. Canonical artifacts remain authoritative.`,
);
