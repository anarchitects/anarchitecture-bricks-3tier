import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const expectedDomainTags = [
  { prefix: 'libs/forms/', tag: 'domain:forms' },
  { prefix: 'libs/auth/', tag: 'domain:auth' },
  { prefix: 'libs/identity/', tag: 'domain:identity' },
  { prefix: 'libs/common/', tag: 'domain:shared' },
];

function findProjectJsonFiles(rootDir) {
  const projectFiles = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(current, entry.name);

      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name === 'project.json') {
        projectFiles.push(fullPath);
      }
    }
  }

  return projectFiles;
}

const workspaceRoot = process.cwd();
const projectJsonFiles = findProjectJsonFiles(join(workspaceRoot, 'libs'));
const errors = [];
let checkedProjects = 0;

for (const projectJsonFile of projectJsonFiles) {
  const relativeProjectJsonPath = relative(workspaceRoot, projectJsonFile);
  const relativeProjectRoot = `${relative(
    workspaceRoot,
    dirname(projectJsonFile),
  )}/`;

  const expected = expectedDomainTags.find((item) =>
    relativeProjectRoot.startsWith(item.prefix),
  );

  if (!expected) {
    continue;
  }

  const parsedProject = JSON.parse(readFileSync(projectJsonFile, 'utf8'));
  const projectName = parsedProject.name ?? relativeProjectRoot;
  const tags = Array.isArray(parsedProject.tags) ? parsedProject.tags : [];

  checkedProjects += 1;

  if (!tags.includes(expected.tag)) {
    errors.push(
      `${projectName}: expected tag "${expected.tag}" for ${relativeProjectRoot} (file: ${relativeProjectJsonPath})`,
    );
  }
}

if (errors.length > 0) {
  console.error('Domain tag validation failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `Domain tag validation passed for ${checkedProjects} project(s) in forms/auth/identity/common.`,
);
