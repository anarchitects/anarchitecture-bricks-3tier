import { execFileSync } from 'node:child_process';

function readProjectGraph() {
  const output = execFileSync('yarn', ['nx', 'graph', '--print'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return JSON.parse(output);
}

function getProjectTags(graph, projectName) {
  const node = graph.nodes?.[projectName];
  return Array.isArray(node?.data?.tags) ? node.data.tags : [];
}

function hasTag(graph, projectName, tag) {
  return getProjectTags(graph, projectName).includes(tag);
}

function getProjectsWithTag(graph, tag) {
  return Object.keys(graph.nodes ?? {}).filter((projectName) =>
    hasTag(graph, projectName, tag),
  );
}

function formatEdge(source, target) {
  return `${source} -> ${target}`;
}

function collectForbiddenEdges(graph, sourceProjects, forbiddenTargetTags) {
  const edges = [];

  for (const sourceProject of sourceProjects) {
    const dependencies = graph.dependencies?.[sourceProject] ?? [];

    for (const dependency of dependencies) {
      const targetProject = dependency.target;
      if (
        forbiddenTargetTags.some((tag) => hasTag(graph, targetProject, tag))
      ) {
        edges.push(formatEdge(sourceProject, targetProject));
      }
    }
  }

  return edges;
}

function run() {
  const projectGraph = readProjectGraph().graph;
  const formsProjects = getProjectsWithTag(projectGraph, 'domain:forms');
  const sharedProjects = getProjectsWithTag(projectGraph, 'domain:shared');

  const formsToAuthEdges = collectForbiddenEdges(projectGraph, formsProjects, [
    'domain:auth',
  ]);
  const sharedToDomainEdges = collectForbiddenEdges(projectGraph, sharedProjects, [
    'domain:forms',
    'domain:auth',
  ]);

  const authNestDependencies = projectGraph.dependencies?.['auth-nest'] ?? [];
  const hasAuthNestToFormsNest = authNestDependencies.some(
    (dependency) => dependency.target === 'forms-nest',
  );

  const errors = [];

  if (formsToAuthEdges.length > 0) {
    errors.push('Forms domain must not depend on auth domain.');
  }

  if (sharedToDomainEdges.length > 0) {
    errors.push('Shared domain must not depend on forms/auth domains.');
  }

  if (hasAuthNestToFormsNest) {
    errors.push('auth-nest must not depend on forms-nest.');
  }

  if (errors.length > 0) {
    console.error('Domain boundary verification failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(
    [
      'Domain boundary verification passed.',
      'Checked forms projects for reverse auth dependencies.',
      'Checked shared projects for forms/auth dependencies.',
      'Confirmed auth-nest has no direct forms-nest dependency.',
    ].join(' '),
  );
}

run();
