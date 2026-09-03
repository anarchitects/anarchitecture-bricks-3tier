import { join } from 'node:path';

import semver from 'semver';

export const TRANSIENT_VERSION_PLAN_PREFIX = 'domain-release-plan-';
export const SUPPORTED_RELEASE_BUMPS = new Set([
  'init',
  'major',
  'premajor',
  'minor',
  'preminor',
  'patch',
  'prepatch',
  'prerelease',
]);

const BUMP_ORDER = {
  none: 0,
  patch: 1,
  minor: 2,
  major: 3,
};

const BUMP_TYPE_NORMALIZATION = {
  prerelease: 'patch',
  prepatch: 'patch',
  preminor: 'minor',
  premajor: 'major',
};

export function inferDomainFromProjectRoot(projectRoot) {
  if (!projectRoot.startsWith('libs/')) {
    return null;
  }

  const [, domain] = projectRoot.split('/');
  return domain || null;
}

export function resolveReleaseGroupsForDomain({
  domain,
  releaseGroups,
  projectNodes,
}) {
  const groups = releaseGroups.filter((releaseGroup) =>
    releaseGroup.projects.some((projectName) => {
      const projectNode = projectNodes[projectName];
      return (
        projectNode &&
        inferDomainFromProjectRoot(projectNode.data.root) === domain
      );
    }),
  );

  if (groups.length === 0) {
    throw new Error(
      `Unsupported domain "${domain}". No release groups matched that domain.`,
    );
  }

  return groups.map((group) => group.name);
}

export function selectReleaseGroupsForDomain({
  domain,
  domainGroupNames,
  requestedGroup,
}) {
  if (!requestedGroup) {
    return domainGroupNames;
  }

  if (!domainGroupNames.includes(requestedGroup)) {
    throw new Error(
      `Release group "${requestedGroup}" does not belong to domain "${domain}". Expected one of: ${domainGroupNames.join(', ')}.`,
    );
  }

  return [requestedGroup];
}

export function expandReleaseGroupsByDependents({
  initialGroupNames,
  releaseGroups,
  projectToDependents,
  projectToReleaseGroup,
  sortedReleaseGroups = [],
}) {
  const groupByName = new Map(
    releaseGroups.map((releaseGroup) => [releaseGroup.name, releaseGroup]),
  );
  const selectedGroups = new Set(initialGroupNames);
  const queue = [...initialGroupNames];

  while (queue.length > 0) {
    const groupName = queue.shift();
    const releaseGroup = groupByName.get(groupName);
    if (!releaseGroup) {
      continue;
    }

    for (const projectName of releaseGroup.projects) {
      const dependents = projectToDependents.get(projectName) ?? new Set();
      for (const dependentProjectName of dependents) {
        const dependentGroupName =
          projectToReleaseGroup.get(dependentProjectName)?.name;
        if (!dependentGroupName || selectedGroups.has(dependentGroupName)) {
          continue;
        }

        selectedGroups.add(dependentGroupName);
        queue.push(dependentGroupName);
      }
    }
  }

  if (sortedReleaseGroups.length === 0) {
    return Array.from(selectedGroups);
  }

  return sortedReleaseGroups.filter((groupName) =>
    selectedGroups.has(groupName),
  );
}

export function detectBumpType(currentVersion, newVersion) {
  if (!newVersion || currentVersion === newVersion) {
    return 'none';
  }

  const releaseType = semver.diff(currentVersion, newVersion);
  switch (releaseType) {
    case 'major':
    case 'minor':
    case 'patch':
      return releaseType;
    case 'premajor':
      return 'major';
    case 'preminor':
      return 'minor';
    case 'prepatch':
    case 'prerelease':
      return 'patch';
    default:
      return 'none';
  }
}

export function validateSharedMajorMinor(groupName, projectEntries) {
  if (projectEntries.length < 2) {
    return;
  }

  const versionLines = new Map();
  for (const entry of projectEntries) {
    const parsed = semver.parse(entry.currentVersion);
    if (!parsed) {
      throw new Error(
        `Project "${entry.projectName}" in release group "${groupName}" has a non-semver version "${entry.currentVersion}".`,
      );
    }

    const line = `${parsed.major}.${parsed.minor}`;
    if (!versionLines.has(line)) {
      versionLines.set(line, []);
    }
    versionLines.get(line).push(entry.projectName);
  }

  if (versionLines.size <= 1) {
    return;
  }

  const details = Array.from(versionLines.entries())
    .map(([line, projects]) => `${line}: ${projects.join(', ')}`)
    .join('; ');

  throw new Error(
    `Release group "${groupName}" must start from a shared major.minor version line. Found ${details}.`,
  );
}

export function computeHybridReleasePlan({
  releaseGroups,
  releaseGroupToFilteredProjects,
  versionData,
}) {
  const projectBumps = {};

  for (const releaseGroup of releaseGroups) {
    const filteredProjects = releaseGroupToFilteredProjects.get(releaseGroup);
    const projectNames = Array.from(
      filteredProjects ?? releaseGroup.projects ?? [],
    );

    const projectEntries = projectNames.map((projectName) => {
      const data = versionData[projectName];
      if (!data) {
        throw new Error(
          `Missing version data for project "${projectName}" in release group "${releaseGroup.name}".`,
        );
      }

      return {
        projectName,
        currentVersion: data.currentVersion,
        newVersion: data.newVersion,
        bumpType: detectBumpType(data.currentVersion, data.newVersion),
      };
    });

    validateSharedMajorMinor(releaseGroup.name, projectEntries);

    const groupBump = projectEntries.reduce((highest, entry) => {
      return BUMP_ORDER[entry.bumpType] > BUMP_ORDER[highest]
        ? entry.bumpType
        : highest;
    }, 'none');

    if (groupBump === 'major' || groupBump === 'minor') {
      for (const entry of projectEntries) {
        projectBumps[entry.projectName] = groupBump;
      }
      continue;
    }

    for (const entry of projectEntries) {
      projectBumps[entry.projectName] = entry.bumpType;
    }
  }

  return projectBumps;
}

function normalizeBumpType(bump) {
  if (bump in BUMP_ORDER) {
    return bump;
  }

  return BUMP_TYPE_NORMALIZATION[bump] ?? 'none';
}

export function applyDependentPatchBumps({
  projectBumps,
  projectToDependents,
  projectsToProcess,
}) {
  const selectedProjects = new Set(projectsToProcess);
  const resolvedProjectBumps = Object.fromEntries(
    Array.from(selectedProjects, (projectName) => [
      projectName,
      normalizeBumpType(projectBumps[projectName]),
    ]),
  );
  const queue = Array.from(selectedProjects).filter(
    (projectName) => resolvedProjectBumps[projectName] !== 'none',
  );

  while (queue.length > 0) {
    const projectName = queue.shift();
    const dependents = projectToDependents.get(projectName) ?? new Set();

    for (const dependentProjectName of dependents) {
      if (!selectedProjects.has(dependentProjectName)) {
        continue;
      }

      if (resolvedProjectBumps[dependentProjectName] !== 'none') {
        continue;
      }

      resolvedProjectBumps[dependentProjectName] = 'patch';
      queue.push(dependentProjectName);
    }
  }

  return resolvedProjectBumps;
}

export function computeHybridReleasePlanFromBumps({
  releaseGroups,
  releaseGroupToFilteredProjects,
  currentVersions,
  directProjectBumps,
  projectToDependents,
}) {
  const projectsToProcess = releaseGroups.flatMap((releaseGroup) =>
    Array.from(
      releaseGroupToFilteredProjects.get(releaseGroup) ??
        releaseGroup.projects ??
        [],
    ),
  );
  const propagatedProjectBumps = applyDependentPatchBumps({
    projectBumps: directProjectBumps,
    projectToDependents,
    projectsToProcess,
  });
  const projectBumps = {};

  for (const releaseGroup of releaseGroups) {
    const filteredProjects = releaseGroupToFilteredProjects.get(releaseGroup);
    const projectNames = Array.from(
      filteredProjects ?? releaseGroup.projects ?? [],
    );

    const projectEntries = projectNames.map((projectName) => {
      const currentVersion = currentVersions[projectName];
      if (!currentVersion) {
        throw new Error(
          `Missing current version data for project "${projectName}" in release group "${releaseGroup.name}".`,
        );
      }

      return {
        projectName,
        currentVersion,
        bumpType: normalizeBumpType(propagatedProjectBumps[projectName]),
      };
    });

    validateSharedMajorMinor(releaseGroup.name, projectEntries);

    const groupBump = projectEntries.reduce((highest, entry) => {
      return BUMP_ORDER[entry.bumpType] > BUMP_ORDER[highest]
        ? entry.bumpType
        : highest;
    }, 'none');

    if (releaseGroup.projectsRelationship === 'fixed' && groupBump !== 'none') {
      for (const entry of projectEntries) {
        projectBumps[entry.projectName] = groupBump;
      }
      continue;
    }

    if (groupBump === 'major' || groupBump === 'minor') {
      for (const entry of projectEntries) {
        projectBumps[entry.projectName] = groupBump;
      }
      continue;
    }

    for (const entry of projectEntries) {
      projectBumps[entry.projectName] = entry.bumpType;
    }
  }

  return projectBumps;
}

export function hasAnyVersionPlanBumps(projectBumps) {
  return Object.values(projectBumps).some((bump) => bump !== 'none');
}

export function createForcedReleasePlan({
  releaseGroups,
  releaseGroupToFilteredProjects,
  bump,
  currentVersions = {},
  firstRelease = false,
}) {
  if (!SUPPORTED_RELEASE_BUMPS.has(bump)) {
    throw new Error(
      `Unsupported release bump "${bump}". Expected one of: ${Array.from(
        SUPPORTED_RELEASE_BUMPS,
      ).join(', ')}.`,
    );
  }

  if (bump === 'init' && !firstRelease) {
    throw new Error(
      'The "init" release bump requires --first-release because it publishes the version already declared on disk.',
    );
  }

  const projectBumps = {};

  for (const releaseGroup of releaseGroups) {
    const filteredProjects = releaseGroupToFilteredProjects.get(releaseGroup);
    const projectNames = Array.from(
      filteredProjects ?? releaseGroup.projects ?? [],
    );

    for (const projectName of projectNames) {
      if (bump === 'init') {
        const currentVersion = currentVersions[projectName];
        if (currentVersion !== '0.0.1') {
          throw new Error(
            `The "init" release bump requires project "${projectName}" to declare version "0.0.1" on disk, but found "${currentVersion ?? 'unknown'}".`,
          );
        }
        projectBumps[projectName] = currentVersion;
        continue;
      }

      projectBumps[projectName] = bump;
    }
  }

  return projectBumps;
}

export function buildVersionPlanContent(projectBumps, message) {
  const frontMatter = Object.entries(projectBumps)
    .filter(([, bump]) => bump !== 'none')
    .map(([projectName, bump]) => `${projectName}: ${bump}`)
    .join('\n');

  return `---\n${frontMatter}\n---\n\n${message}\n`;
}

export function createTransientVersionPlan({
  workspaceRoot,
  projectBumps,
  domain,
}) {
  const fileName = `${TRANSIENT_VERSION_PLAN_PREFIX}${domain}-${Date.now()}.md`;

  return {
    fileName,
    filePath: join(workspaceRoot, '.nx', 'version-plans', fileName),
    content: buildVersionPlanContent(
      projectBumps,
      `Transient version plan generated for ${domain} domain release orchestration.`,
    ),
  };
}
