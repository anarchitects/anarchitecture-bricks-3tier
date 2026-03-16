import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const workspaceRoot = process.cwd();
const docsRoot = join(workspaceRoot, 'dist/docs-hub');

const requiredFiles = [
  'index.html',
  'packages/index.html',
  'guides/angular.html',
  'guides/nest.html',
  'guides/design-ui-systems.html',
  'guides/ai-agents.html',
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

const missingPackagePages = [];
for (const pkg of catalog.packages) {
  if (!pkg.readmePath || !pkg.slug) {
    continue;
  }

  const renderedPage = join(docsRoot, `packages/${pkg.slug}/index.html`);
  if (!existsSync(renderedPage)) {
    missingPackagePages.push(`- ${pkg.importPath} (${renderedPage})`);
  }
}

if (missingPackagePages.length > 0) {
  console.error('Missing rendered package README pages:');
  for (const item of missingPackagePages) {
    console.error(item);
  }
  process.exit(1);
}

const homePage = readFileSync(join(docsRoot, 'index.html'), 'utf8');
if (
  !homePage.includes('/storybook/') ||
  !homePage.includes('/openapi/openapi.yaml') ||
  !homePage.includes('/guides/design-ui-systems.html') ||
  !homePage.includes('/guides/ai-agents.html')
) {
  console.error('Home page does not include required docs entry links.');
  process.exit(1);
}

console.log(
  `Docs hub verification passed (${requiredFiles.length} core files, ${catalog.packages.length} package entries).`,
);
