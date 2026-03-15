import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const workspaceRoot = process.cwd();
const docsRoot = join(workspaceRoot, 'dist/docs-hub');

const requiredFiles = [
  'index.html',
  'packages/index.html',
  'guides/angular.html',
  'guides/nest.html',
  'release/index.html',
  'assets/site.css',
  'data/packages.catalog.json',
];

for (const requiredFile of requiredFiles) {
  const absolutePath = join(docsRoot, requiredFile);
  if (!existsSync(absolutePath)) {
    console.error(`Missing required docs-hub artifact: ${absolutePath}`);
    process.exit(1);
  }
}

const catalog = JSON.parse(
  readFileSync(join(docsRoot, 'data/packages.catalog.json'), 'utf8'),
);

if (!Array.isArray(catalog.packages) || catalog.packages.length === 0) {
  console.error(
    'Packages catalog is empty. Run `nx run docs-hub:sync-packages` and inspect package detection.',
  );
  process.exit(1);
}

const homePage = readFileSync(join(docsRoot, 'index.html'), 'utf8');
if (!homePage.includes('/storybook/') || !homePage.includes('/openapi/openapi.yaml')) {
  console.error('Home page does not include required Storybook/OpenAPI entry links.');
  process.exit(1);
}

console.log(
  `Docs hub verification passed (${requiredFiles.length} files, ${catalog.packages.length} packages).`,
);
