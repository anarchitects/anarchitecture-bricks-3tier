import assert from 'node:assert/strict';
import {
  assertMaintenanceHistory,
  assertPatchIntent,
  commit,
  git,
  isAncestor,
  maintenanceLine,
  readManifests,
} from './release-line.mjs';

// Accepted #518 merge: includes R1, the #513 security fix and release routing.
export const maintenanceBranchPoint =
  'e8313e64b17fe98edd9470bd5169067e350d54c8';

export function checkMaintenanceBackport(
  root,
  {
    baseRef,
    baseSha,
    headSha,
    title,
    branchPoint = maintenanceBranchPoint,
    baseline,
  },
) {
  assert.equal(baseRef, maintenanceLine, 'Backports must target maint/nest-11');
  for (const sha of [baseSha, headSha]) {
    assert.match(
      sha ?? '',
      /^[a-f0-9]{40}$/,
      'Exact PR base/head SHAs are required',
    );
    assert.equal(commit(root, sha), sha);
  }
  assert.ok(
    title?.trim(),
    'PR title is required to check squash-commit intent',
  );
  assert.ok(
    isAncestor(root, branchPoint, baseSha),
    'PR base predates the accepted maintenance branch point',
  );
  assert.ok(
    isAncestor(root, branchPoint, headSha),
    'PR head lacks the accepted maintenance branch point',
  );
  const checkout = commit(root, 'HEAD');
  assert.ok(
    isAncestor(root, baseSha, checkout) && isAncestor(root, headSha, checkout),
    'Validate the current PR merge checkout',
  );
  assertPatchIntent([
    title,
    ...git(root, ['log', '--format=%B%x00', `${baseSha}..${headSha}`]).split(
      '\0',
    ),
  ]);
  assertMaintenanceHistory(root, { baseline });
  const base = readManifests(root, baseSha);
  const merged = readManifests(root);
  for (const [project, pkg] of Object.entries(merged)) {
    assert.equal(
      pkg.version,
      base[project].version,
      `${project}: backport PRs must leave versioning to Release (Manual)`,
    );
  }
  return { branchPoint, baseSha, headSha, mergeSha: checkout };
}
