import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join } from 'node:path';

import {
  computeHybridReleasePlanFromBumps,
  createTransientVersionPlan,
  getInternalGroupsForDomain,
  hasAnyVersionPlanBumps,
} from './domain-release-lib.mjs';

const require = createRequire(import.meta.url);
const semver = require('semver');
const { ReleaseClient } = require('nx/release');
const { FsTree } = require('nx/src/generators/tree.js');
const { createProjectFileMapUsingProjectGraph } = require('nx/src/project-graph/file-map-utils.js');
const { createProjectGraphAsync } = require('nx/src/project-graph/project-graph.js');
const {
  createNxReleaseConfig,
  handleNxReleaseConfigError,
} = require('nx/src/command-line/release/config/config.js');
const {
  createReleaseGraph,
} = require('nx/src/command-line/release/utils/release-graph.js');
const {
  deriveSpecifierFromConventionalCommits,
} = require('nx/src/command-line/release/version/derive-specifier-from-conventional-commits.js');
const {
  ReleaseVersion,
  createCommitMessageValues,
  createGitTagValues,
  handleDuplicateGitTags,
} = require('nx/src/command-line/release/utils/shared.js');
const {
  getCommitHash,
  gitCommit,
  gitPush,
  gitTag,
} = require('nx/src/command-line/release/utils/git.js');
const {
  createRemoteReleaseClient,
} = require('nx/src/command-line/release/utils/remote-release-clients/remote-release-client.js');
const {
  GithubRemoteReleaseClient,
} = require('nx/src/command-line/release/utils/remote-release-clients/github.js');

const workspaceRoot = process.cwd();
const versionPlansDir = join(workspaceRoot, '.nx', 'version-plans');
const rawNxJson = JSON.parse(readFileSync(join(workspaceRoot, 'nx.json'), 'utf8'));
const releaseGitConfig = rawNxJson.release?.git ?? {};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const internalGroups = getInternalGroupsForDomain(options.domain);

  console.log(`Running domain release for "${options.domain}" via groups: ${internalGroups.join(', ')}`);

  assertNoExistingVersionPlans();

  const baseClient = new ReleaseClient({});
  const projectBumps = await discoverHybridReleasePlan({
    firstRelease: options.firstRelease,
    groups: internalGroups,
    verbose: options.verbose,
  });

  logComputedPlan(projectBumps);

  const transientPlan = hasAnyVersionPlanBumps(projectBumps)
    ? createTransientVersionPlan({
        workspaceRoot,
        projectBumps,
        domain: options.domain,
      })
    : null;

  if (transientPlan) {
    mkdirSync(dirname(transientPlan.filePath), { recursive: true });
    writeFileSync(transientPlan.filePath, transientPlan.content);
    console.log(`Created transient version plan ${basename(transientPlan.filePath)}`);
  } else {
    console.log('No transient version plan file was needed because no version bumps were selected.');
  }

  const versionPlanClient = new ReleaseClient(buildVersionPlansOverride(internalGroups));
  let versionResult;

  try {
    versionResult = await versionPlanClient.releaseVersion({
      groups: internalGroups,
      dryRun: options.dryRun,
      verbose: options.verbose,
      firstRelease: options.firstRelease,
      deleteVersionPlans: false,
      gitCommit: false,
      gitTag: false,
      stageChanges: true,
    });
  } finally {
    cleanupTransientPlan(transientPlan);
  }

  const changelogClient = new ReleaseClient(buildChangelogOverride(internalGroups));
  const changelogResult = await changelogClient.releaseChangelog({
    groups: internalGroups,
    versionData: versionResult.projectsVersionData,
    dryRun: options.dryRun,
    verbose: options.verbose,
    firstRelease: options.firstRelease,
    createRelease: false,
    gitCommit: false,
    gitTag: false,
    gitPush: false,
    stageChanges: true,
  });

  const selectedVersionGroups = filterReleaseGroups(versionResult.releaseGraph, internalGroups);
  const hasNewVersion = Object.values(versionResult.projectsVersionData).some(
    (version) => version.newVersion !== null || version.dockerVersion !== null,
  );

  if (hasNewVersion) {
    const commitMessages = createCommitMessageValues(
      selectedVersionGroups,
      versionResult.releaseGraph.releaseGroupToFilteredProjects,
      versionResult.projectsVersionData,
      releaseGitConfig.commitMessage ?? 'chore(release): publish {version}',
    );

    await gitCommit({
      messages: commitMessages,
      additionalArgs: releaseGitConfig.commitArgs ?? '',
      dryRun: options.dryRun,
      verbose: options.verbose,
    });

    const gitTagValues = createGitTagValues(
      selectedVersionGroups,
      versionResult.releaseGraph.releaseGroupToFilteredProjects,
      versionResult.projectsVersionData,
    );
    handleDuplicateGitTags(gitTagValues);

    for (const tag of gitTagValues) {
      await gitTag({
        tag,
        message: releaseGitConfig.tagMessage ?? '',
        additionalArgs: releaseGitConfig.tagArgs ?? '',
        dryRun: options.dryRun,
        verbose: options.verbose,
      });
    }

    const shouldPush = selectedVersionGroups.some(
      (group) => group.changelog !== false && group.changelog.createRelease !== false,
    );

    if (shouldPush) {
      await gitPush({
        gitRemote: releaseGitConfig.remote ?? 'origin',
        additionalArgs: releaseGitConfig.pushArgs ?? '',
        dryRun: options.dryRun,
        verbose: options.verbose,
      });

      await createProjectRemoteReleases({
        dryRun: options.dryRun,
        releaseGroups: selectedVersionGroups,
        releaseGraph: versionResult.releaseGraph,
        projectChangelogs: changelogResult.projectChangelogs ?? {},
      });
    }
  }

  const shouldPublish = options.yes && !options.skipPublish && hasNewVersion;
  if (shouldPublish) {
    const publishResults = await baseClient.releasePublish({
      groups: internalGroups,
      dryRun: options.dryRun,
      verbose: options.verbose,
      firstRelease: options.firstRelease,
      versionData: versionResult.projectsVersionData,
    });
    const allExitOk = Object.values(publishResults).every((result) => result.code === 0);
    if (!allExitOk) {
      process.exit(1);
    }
  } else {
    console.log('Skipped publishing packages.');
  }
}

async function discoverHybridReleasePlan({ firstRelease, groups, verbose }) {
  const tree = new FsTree(workspaceRoot, verbose);
  const projectGraph = await createProjectGraphAsync({ exitOnError: true });
  const { error: configError, nxReleaseConfig } = await createNxReleaseConfig(
    projectGraph,
    await createProjectFileMapUsingProjectGraph(projectGraph),
    rawNxJson.release ?? {},
  );

  if (configError) {
    await handleNxReleaseConfigError(configError);
    process.exit(1);
  }

  const releaseGraph = await createReleaseGraph({
    tree,
    projectGraph,
    nxReleaseConfig,
    filters: { groups },
    firstRelease,
    verbose,
  });
  const selectedReleaseGroups = filterReleaseGroups(releaseGraph, groups);
  const directProjectBumps = {};
  const currentVersions = {};

  for (const releaseGroup of selectedReleaseGroups) {
    const filteredProjects = Array.from(
      releaseGraph.releaseGroupToFilteredProjects.get(releaseGroup) ?? releaseGroup.projects ?? [],
    );

    for (const projectName of filteredProjects) {
      if (projectName in directProjectBumps) {
        continue;
      }

      const finalConfig = releaseGraph.finalConfigsByProject.get(projectName);
      if (!finalConfig) {
        throw new Error(`Unable to resolve release config for project "${projectName}".`);
      }

      if (finalConfig.specifierSource !== 'conventional-commits') {
        throw new Error(
          `Project "${projectName}" in release group "${releaseGroup.name}" must use conventional commits for domain-release planning.`,
        );
      }

      const currentVersion = releaseGraph.cachedCurrentVersions.get(projectName);
      if (currentVersion === undefined) {
        throw new Error(`Unable to resolve the current version for project "${projectName}".`);
      }

      currentVersions[projectName] = currentVersion;

      const bumpSpecifier = await deriveSpecifierFromConventionalCommits(
        nxReleaseConfig,
        projectGraph,
        releaseGraph.projectLoggers.get(projectName),
        releaseGroup,
        projectGraph.nodes[projectName],
        !!semver.prerelease(currentVersion),
        releaseGraph.cachedLatestMatchingGitTag.get(projectName),
        releaseGraph,
        finalConfig.fallbackCurrentVersionResolver,
        undefined,
      );

      directProjectBumps[projectName] = bumpSpecifier;
    }
  }

  return computeHybridReleasePlanFromBumps({
    releaseGroups: selectedReleaseGroups,
    releaseGroupToFilteredProjects: releaseGraph.releaseGroupToFilteredProjects,
    currentVersions,
    directProjectBumps,
    projectToDependents: releaseGraph.projectToDependents,
  });
}

function parseArgs(argv) {
  const options = {
    domain: null,
    dryRun: false,
    verbose: false,
    yes: false,
    skipPublish: false,
    firstRelease: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--domain') {
      options.domain = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg.startsWith('--domain=')) {
      options.domain = arg.slice('--domain='.length);
      continue;
    }

    if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--verbose') {
      options.verbose = true;
      continue;
    }

    if (arg === '--yes') {
      options.yes = true;
      continue;
    }

    if (arg === '--skip-publish') {
      options.skipPublish = true;
      continue;
    }

    if (arg === '--first-release') {
      options.firstRelease = true;
      continue;
    }

    throw new Error(`Unsupported argument "${arg}".`);
  }

  if (!options.domain) {
    throw new Error('Missing required --domain argument.');
  }

  return options;
}

function assertNoExistingVersionPlans() {
  if (!existsSync(versionPlansDir)) {
    return;
  }

  const existingFiles = readdirSync(versionPlansDir).filter(Boolean);
  if (existingFiles.length === 0) {
    return;
  }

  throw new Error(
    `Refusing to run with existing version plan files in .nx/version-plans: ${existingFiles.join(', ')}.`,
  );
}

function buildVersionPlansOverride(groupNames) {
  return {
    groups: Object.fromEntries(groupNames.map((groupName) => [groupName, { versionPlans: true }])),
  };
}

function buildChangelogOverride(groupNames) {
  return {
    groups: Object.fromEntries(
      groupNames.map((groupName) => [groupName, { changelog: { createRelease: false } }]),
    ),
  };
}

function filterReleaseGroups(releaseGraph, groupNames) {
  const selected = releaseGraph.releaseGroups.filter((group) => groupNames.includes(group.name));
  if (selected.length !== groupNames.length) {
    const found = new Set(selected.map((group) => group.name));
    const missing = groupNames.filter((groupName) => !found.has(groupName));
    throw new Error(`Unable to resolve release groups: ${missing.join(', ')}.`);
  }

  return selected;
}

function cleanupTransientPlan(transientPlan) {
  if (!transientPlan || !existsSync(transientPlan.filePath)) {
    return;
  }

  rmSync(transientPlan.filePath, { force: true });

  if (existsSync(versionPlansDir) && readdirSync(versionPlansDir).length === 0) {
    rmSync(versionPlansDir, { recursive: true, force: true });
  }
}

function logComputedPlan(projectBumps) {
  const entries = Object.entries(projectBumps);
  if (entries.length === 0) {
    console.log('No projects were selected for version planning.');
    return;
  }

  console.log('Computed hybrid release bumps:');
  for (const [projectName, bump] of entries) {
    console.log(`- ${projectName}: ${bump}`);
  }
}

async function createProjectRemoteReleases({
  dryRun,
  releaseGroups,
  releaseGraph,
  projectChangelogs,
}) {
  if (Object.keys(projectChangelogs).length === 0) {
    return;
  }

  const latestCommit = await getCommitHash('HEAD');

  for (const releaseGroup of releaseGroups) {
    if (releaseGroup.changelog === false || releaseGroup.changelog.createRelease === false) {
      continue;
    }

    const projects = Array.from(releaseGraph.releaseGroupToFilteredProjects.get(releaseGroup) ?? []);

    if (dryRun) {
      const repoData = GithubRemoteReleaseClient.resolveRepoData(releaseGroup.changelog.createRelease);
      for (const projectName of projects) {
        const changelog = projectChangelogs[projectName];
        if (!changelog || !repoData) {
          continue;
        }

        const releaseVersion = new ReleaseVersion({
          version: changelog.releaseVersion.rawVersion,
          releaseTagPattern: releaseGroup.releaseTag.pattern,
          projectName,
          releaseGroupName: releaseGroup.name,
        });

        console.error(
          `CREATE https://${repoData.hostname}/${repoData.slug}/releases/tag/${releaseVersion.gitTag} [dry-run]`,
        );
        console.log(changelog.contents);
      }
      continue;
    }

    const remoteReleaseClient = await createRemoteReleaseClient(releaseGroup.changelog.createRelease);
    for (const projectName of projects) {
      const changelog = projectChangelogs[projectName];
      if (!changelog) {
        continue;
      }

      console.log(`Creating ${remoteReleaseClient.remoteReleaseProviderName} Release`);
      await remoteReleaseClient.createOrUpdateRelease(
        changelog.releaseVersion,
        changelog.contents,
        latestCommit,
        { dryRun },
      );
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
