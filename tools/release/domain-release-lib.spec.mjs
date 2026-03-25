import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeHybridReleasePlanFromBumps,
  computeHybridReleasePlan,
  createTransientVersionPlan,
  getInternalGroupsForDomain,
} from './domain-release-lib.mjs';

function buildReleaseGroup(name, projects) {
  return { name, projects };
}

test('getInternalGroupsForDomain maps common to split release groups', () => {
  assert.deepEqual(getInternalGroupsForDomain('common'), ['common-angular', 'common-nest']);
});

test('computeHybridReleasePlan promotes all peers to a shared minor bump', () => {
  const authGroup = buildReleaseGroup('auth', ['auth-angular', 'auth-nest', 'auth-ts']);
  const plan = computeHybridReleasePlan({
    releaseGroups: [authGroup],
    releaseGroupToFilteredProjects: new Map([[authGroup, new Set(authGroup.projects)]]),
    versionData: {
      'auth-angular': { currentVersion: '0.3.0', newVersion: '0.4.0', dependentProjects: [] },
      'auth-nest': { currentVersion: '0.3.2', newVersion: '0.4.0', dependentProjects: [] },
      'auth-ts': { currentVersion: '0.3.4', newVersion: null, dependentProjects: [] },
    },
  });

  assert.deepEqual(plan, {
    'auth-angular': 'minor',
    'auth-nest': 'minor',
    'auth-ts': 'minor',
  });
});

test('computeHybridReleasePlan keeps patch bumps independent', () => {
  const formsGroup = buildReleaseGroup('forms', ['forms-angular', 'forms-nest', 'forms-ts']);
  const plan = computeHybridReleasePlan({
    releaseGroups: [formsGroup],
    releaseGroupToFilteredProjects: new Map([[formsGroup, new Set(formsGroup.projects)]]),
    versionData: {
      'forms-angular': { currentVersion: '0.3.1', newVersion: '0.3.2', dependentProjects: [] },
      'forms-nest': { currentVersion: '0.3.4', newVersion: null, dependentProjects: [] },
      'forms-ts': { currentVersion: '0.3.0', newVersion: '0.3.1', dependentProjects: [] },
    },
  });

  assert.deepEqual(plan, {
    'forms-angular': 'patch',
    'forms-nest': 'none',
    'forms-ts': 'patch',
  });
});

test('computeHybridReleasePlanFromBumps propagates dependency patch bumps to dependents', () => {
  const authGroup = buildReleaseGroup('auth', ['auth-angular', 'auth-nest', 'auth-ts']);
  const plan = computeHybridReleasePlanFromBumps({
    releaseGroups: [authGroup],
    releaseGroupToFilteredProjects: new Map([[authGroup, new Set(authGroup.projects)]]),
    currentVersions: {
      'auth-angular': '0.4.0',
      'auth-nest': '0.4.0',
      'auth-ts': '0.4.0',
    },
    directProjectBumps: {
      'auth-angular': 'none',
      'auth-nest': 'none',
      'auth-ts': 'patch',
    },
    projectToDependents: new Map([
      ['auth-ts', new Set(['auth-angular', 'auth-nest'])],
      ['auth-angular', new Set()],
      ['auth-nest', new Set()],
    ]),
  });

  assert.deepEqual(plan, {
    'auth-angular': 'patch',
    'auth-nest': 'patch',
    'auth-ts': 'patch',
  });
});

test('computeHybridReleasePlanFromBumps promotes all fixed-group peers when one project bumps', () => {
  const fixedGroup = {
    name: 'common-fixed',
    projects: ['common-a', 'common-b'],
    projectsRelationship: 'fixed',
  };
  const plan = computeHybridReleasePlanFromBumps({
    releaseGroups: [fixedGroup],
    releaseGroupToFilteredProjects: new Map([[fixedGroup, new Set(fixedGroup.projects)]]),
    currentVersions: {
      'common-a': '0.4.0',
      'common-b': '0.4.2',
    },
    directProjectBumps: {
      'common-a': 'patch',
      'common-b': 'none',
    },
    projectToDependents: new Map([
      ['common-a', new Set()],
      ['common-b', new Set()],
    ]),
  });

  assert.deepEqual(plan, {
    'common-a': 'patch',
    'common-b': 'patch',
  });
});

test('computeHybridReleasePlan throws when a multi-project group does not share major.minor', () => {
  const commonAngularGroup = buildReleaseGroup('common-angular', [
    'common-angular-design',
    'common-angular-ui-primitives',
  ]);

  assert.throws(
    () =>
      computeHybridReleasePlan({
        releaseGroups: [commonAngularGroup],
        releaseGroupToFilteredProjects: new Map([
          [commonAngularGroup, new Set(commonAngularGroup.projects)],
        ]),
        versionData: {
          'common-angular-design': {
            currentVersion: '0.0.1',
            newVersion: '0.0.2',
            dependentProjects: [],
          },
          'common-angular-ui-primitives': {
            currentVersion: '0.1.0',
            newVersion: null,
            dependentProjects: [],
          },
        },
      }),
    /shared major\.minor version line/,
  );
});

test('createTransientVersionPlan renders only bumped projects', () => {
  const plan = createTransientVersionPlan({
    workspaceRoot: '/tmp/workspace',
    domain: 'auth',
    projectBumps: {
      'auth-angular': 'minor',
      'auth-nest': 'minor',
      'auth-ts': 'none',
    },
  });

  assert.equal(plan.filePath.startsWith('/tmp/workspace/.nx/version-plans/domain-release-plan-auth-'), true);
  assert.match(plan.content, /auth-angular: minor/);
  assert.match(plan.content, /auth-nest: minor/);
  assert.doesNotMatch(plan.content, /auth-ts:/);
});
