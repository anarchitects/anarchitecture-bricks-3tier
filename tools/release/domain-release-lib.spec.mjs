import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeHybridReleasePlanFromBumps,
  computeHybridReleasePlan,
  createForcedReleasePlan,
  createTransientVersionPlan,
  expandReleaseGroupsByDependents,
  inferDomainFromProjectRoot,
  resolveReleaseGroupsForDomain,
  selectReleaseGroupsForDomain,
  SUPPORTED_RELEASE_BUMPS,
} from './domain-release-lib.mjs';

function buildReleaseGroup(name, projects) {
  return { name, projects };
}

test('inferDomainFromProjectRoot resolves library domains from project roots', () => {
  assert.equal(
    inferDomainFromProjectRoot('libs/common/angular/ui-layouts'),
    'common',
  );
  assert.equal(inferDomainFromProjectRoot('libs/auth/angular'), 'auth');
  assert.equal(inferDomainFromProjectRoot('libs/identity/nest'), 'identity');
  assert.equal(inferDomainFromProjectRoot('tools/release'), null);
});

test('resolveReleaseGroupsForDomain maps a domain to all matching release groups dynamically', () => {
  const releaseGroups = [
    buildReleaseGroup('forms', ['forms-angular', 'forms-nest', 'forms-ts']),
    buildReleaseGroup('auth', ['auth-angular', 'auth-nest', 'auth-ts']),
    buildReleaseGroup('identity', [
      'identity-angular',
      'identity-nest',
      'identity-ts',
    ]),
    buildReleaseGroup('common-angular', ['common-angular-ui-layouts']),
    buildReleaseGroup('common-nest', ['common-nest-mailer']),
    buildReleaseGroup('common-tailwind', ['tailwind']),
  ];
  const projectNodes = {
    'forms-angular': { data: { root: 'libs/forms/angular' } },
    'forms-nest': { data: { root: 'libs/forms/nest' } },
    'forms-ts': { data: { root: 'libs/forms/ts' } },
    'auth-angular': { data: { root: 'libs/auth/angular' } },
    'auth-nest': { data: { root: 'libs/auth/nest' } },
    'auth-ts': { data: { root: 'libs/auth/ts' } },
    'identity-angular': { data: { root: 'libs/identity/angular' } },
    'identity-nest': { data: { root: 'libs/identity/nest' } },
    'identity-ts': { data: { root: 'libs/identity/ts' } },
    'common-angular-ui-layouts': {
      data: { root: 'libs/common/angular/ui-layouts' },
    },
    'common-nest-mailer': { data: { root: 'libs/common/nest/mailer' } },
    tailwind: { data: { root: 'libs/common/tailwind' } },
  };

  assert.deepEqual(
    resolveReleaseGroupsForDomain({
      domain: 'identity',
      releaseGroups,
      projectNodes,
    }),
    ['identity'],
  );

  assert.deepEqual(
    resolveReleaseGroupsForDomain({
      domain: 'common',
      releaseGroups,
      projectNodes,
    }),
    ['common-angular', 'common-nest', 'common-tailwind'],
  );
});

test('selectReleaseGroupsForDomain safely narrows a multi-group domain', () => {
  const domainGroupNames = ['common-angular', 'common-nest', 'common-tailwind'];

  assert.deepEqual(
    selectReleaseGroupsForDomain({
      domain: 'common',
      domainGroupNames,
      requestedGroup: 'common-tailwind',
    }),
    ['common-tailwind'],
  );
  assert.deepEqual(
    selectReleaseGroupsForDomain({
      domain: 'common',
      domainGroupNames,
      requestedGroup: null,
    }),
    domainGroupNames,
  );
  assert.throws(
    () =>
      selectReleaseGroupsForDomain({
        domain: 'forms',
        domainGroupNames: ['forms'],
        requestedGroup: 'common-tailwind',
      }),
    /does not belong to domain "forms"/,
  );
});

test('expandReleaseGroupsByDependents cascades transitively through downstream release groups', () => {
  const formsGroup = buildReleaseGroup('forms', ['forms-angular', 'forms-ts']);
  const authGroup = buildReleaseGroup('auth', ['auth-angular']);
  const storefrontGroup = buildReleaseGroup('storefront', [
    'storefront-angular',
  ]);

  assert.deepEqual(
    expandReleaseGroupsByDependents({
      initialGroupNames: ['forms'],
      releaseGroups: [formsGroup, authGroup, storefrontGroup],
      projectToDependents: new Map([
        ['forms-angular', new Set(['auth-angular'])],
        ['forms-ts', new Set(['auth-angular'])],
        ['auth-angular', new Set(['storefront-angular'])],
      ]),
      projectToReleaseGroup: new Map([
        ['forms-angular', formsGroup],
        ['forms-ts', formsGroup],
        ['auth-angular', authGroup],
        ['storefront-angular', storefrontGroup],
      ]),
      sortedReleaseGroups: ['forms', 'auth', 'storefront'],
    }),
    ['forms', 'auth', 'storefront'],
  );
});

test('computeHybridReleasePlan promotes all peers to a shared minor bump', () => {
  const authGroup = buildReleaseGroup('auth', [
    'auth-angular',
    'auth-nest',
    'auth-ts',
  ]);
  const plan = computeHybridReleasePlan({
    releaseGroups: [authGroup],
    releaseGroupToFilteredProjects: new Map([
      [authGroup, new Set(authGroup.projects)],
    ]),
    versionData: {
      'auth-angular': {
        currentVersion: '0.3.0',
        newVersion: '0.4.0',
        dependentProjects: [],
      },
      'auth-nest': {
        currentVersion: '0.3.2',
        newVersion: '0.4.0',
        dependentProjects: [],
      },
      'auth-ts': {
        currentVersion: '0.3.4',
        newVersion: null,
        dependentProjects: [],
      },
    },
  });

  assert.deepEqual(plan, {
    'auth-angular': 'minor',
    'auth-nest': 'minor',
    'auth-ts': 'minor',
  });
});

test('computeHybridReleasePlan keeps patch bumps independent', () => {
  const formsGroup = buildReleaseGroup('forms', [
    'forms-angular',
    'forms-nest',
    'forms-ts',
  ]);
  const plan = computeHybridReleasePlan({
    releaseGroups: [formsGroup],
    releaseGroupToFilteredProjects: new Map([
      [formsGroup, new Set(formsGroup.projects)],
    ]),
    versionData: {
      'forms-angular': {
        currentVersion: '0.3.1',
        newVersion: '0.3.2',
        dependentProjects: [],
      },
      'forms-nest': {
        currentVersion: '0.3.4',
        newVersion: null,
        dependentProjects: [],
      },
      'forms-ts': {
        currentVersion: '0.3.0',
        newVersion: '0.3.1',
        dependentProjects: [],
      },
    },
  });

  assert.deepEqual(plan, {
    'forms-angular': 'patch',
    'forms-nest': 'none',
    'forms-ts': 'patch',
  });
});

test('computeHybridReleasePlanFromBumps propagates dependency patch bumps to dependents', () => {
  const authGroup = buildReleaseGroup('auth', [
    'auth-angular',
    'auth-nest',
    'auth-ts',
  ]);
  const plan = computeHybridReleasePlanFromBumps({
    releaseGroups: [authGroup],
    releaseGroupToFilteredProjects: new Map([
      [authGroup, new Set(authGroup.projects)],
    ]),
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
    releaseGroupToFilteredProjects: new Map([
      [fixedGroup, new Set(fixedGroup.projects)],
    ]),
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

test('createForcedReleasePlan applies a manual bump to every project in the selected groups', () => {
  const authGroup = buildReleaseGroup('auth', [
    'auth-angular',
    'auth-declarations',
    'auth-nest',
  ]);
  const plan = createForcedReleasePlan({
    releaseGroups: [authGroup],
    releaseGroupToFilteredProjects: new Map([
      [authGroup, new Set(authGroup.projects)],
    ]),
    bump: 'patch',
  });

  assert.deepEqual(plan, {
    'auth-angular': 'patch',
    'auth-declarations': 'patch',
    'auth-nest': 'patch',
  });
});

test('createForcedReleasePlan rejects unsupported manual bump values', () => {
  const authGroup = buildReleaseGroup('auth', ['auth-angular']);

  assert.throws(
    () =>
      createForcedReleasePlan({
        releaseGroups: [authGroup],
        releaseGroupToFilteredProjects: new Map([
          [authGroup, new Set(authGroup.projects)],
        ]),
        bump: 'banana',
      }),
    new RegExp(
      `Expected one of: ${Array.from(SUPPORTED_RELEASE_BUMPS).join(', ')}`,
    ),
  );
});

test('createForcedReleasePlan keeps declared 0.0.1 versions for coordinated first releases', () => {
  const commonAngularGroup = buildReleaseGroup('common-angular', [
    'common-angular-a',
  ]);
  const commonTailwindGroup = buildReleaseGroup('common-tailwind', [
    'tailwind',
  ]);
  const releaseGroups = [commonAngularGroup, commonTailwindGroup];

  assert.deepEqual(
    createForcedReleasePlan({
      releaseGroups,
      releaseGroupToFilteredProjects: new Map(
        releaseGroups.map((group) => [group, new Set(group.projects)]),
      ),
      bump: 'init',
      currentVersions: {
        'common-angular-a': '0.0.1',
        tailwind: '0.0.1',
      },
      firstRelease: true,
    }),
    {
      'common-angular-a': '0.0.1',
      tailwind: '0.0.1',
    },
  );
});

test('createForcedReleasePlan guards init releases', () => {
  const tailwindGroup = buildReleaseGroup('common-tailwind', ['tailwind']);
  const releaseGroupToFilteredProjects = new Map([
    [tailwindGroup, new Set(tailwindGroup.projects)],
  ]);

  assert.throws(
    () =>
      createForcedReleasePlan({
        releaseGroups: [tailwindGroup],
        releaseGroupToFilteredProjects,
        bump: 'init',
        currentVersions: { tailwind: '0.0.1' },
      }),
    /requires --first-release/,
  );
  assert.throws(
    () =>
      createForcedReleasePlan({
        releaseGroups: [tailwindGroup],
        releaseGroupToFilteredProjects,
        bump: 'init',
        currentVersions: { tailwind: '0.1.0' },
        firstRelease: true,
      }),
    /declare version "0\.0\.1".*found "0\.1\.0"/,
  );
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

  assert.equal(
    plan.filePath.startsWith(
      '/tmp/workspace/.nx/version-plans/domain-release-plan-auth-',
    ),
    true,
  );
  assert.match(plan.content, /auth-angular: minor/);
  assert.match(plan.content, /auth-nest: minor/);
  assert.doesNotMatch(plan.content, /auth-ts:/);
});
