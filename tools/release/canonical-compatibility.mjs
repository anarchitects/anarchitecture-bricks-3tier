import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { gitJson, wireOperations } from '../api-specs/compatibility.mjs';
import { json } from '../api-specs/canonical-artifacts.mjs';
const require = createRequire(import.meta.url);
const semver = require('semver');

export function assertBreakingVersion(project, current, proposed) {
  assert.ok(semver.valid(current), `${project}: invalid current version`);
  const minimum = semver.inc(
    current,
    semver.major(current) === 0 ? 'minor' : 'major',
  );
  assert.ok(
    semver.valid(proposed) && semver.gte(proposed, minimum),
    `${project}: canonical adoption/wire change requires >=${minimum}; Nx proposed ${proposed ?? 'no release'}`,
  );
}

export function validateCanonicalReleaseVersions(
  versionData,
  {
    readAt = gitJson,
    rootPackage = JSON.parse(readFileSync('package.json', 'utf8')),
    implementation = JSON.parse(
      readFileSync('docs/openapi/openapi.json', 'utf8'),
    ),
  } = {},
) {
  for (const [project, data] of Object.entries(versionData)) {
    const match =
      /^(auth|forms|identity|newsletter)-(?:ts|nest|angular|declarations)$/.exec(
        project,
      );
    if (!match) continue;
    const domain = match[1];
    const tag = `${project}@${data.currentVersion}`;
    const previousPackage = readAt(tag, 'package.json');
    const previousDocument = readAt(tag, 'docs/openapi/openapi.json');
    const dependency = `@anarchitects/${domain}-contracts`;
    const changed =
      previousPackage.dependencies?.[dependency] !==
        rootPackage.dependencies?.[dependency] ||
      json(wireOperations(previousDocument, domain)) !==
        json(wireOperations(implementation, domain));
    if (changed)
      assertBreakingVersion(project, data.currentVersion, data.newVersion);
  }
}
