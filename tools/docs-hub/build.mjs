import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const workspaceRoot = process.cwd();
const catalogFile = join(workspaceRoot, 'dist/docs-hub/data/packages.catalog.json');
const outputRoot = join(workspaceRoot, 'dist/docs-hub');

function ensureDir(dirPath) {
  mkdirSync(dirPath, { recursive: true });
}

function escapeHtml(input) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function pageTemplate(title, activePath, content, generatedAt) {
  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/packages/', label: 'Packages' },
    { href: '/guides/angular.html', label: 'Angular Guide' },
    { href: '/guides/nest.html', label: 'Nest Guide' },
    { href: '/release/', label: 'Release' },
    { href: '/storybook/', label: 'Storybook' },
    { href: '/openapi/openapi.yaml', label: 'OpenAPI' },
  ];

  const nav = navItems
    .map((item) => {
      const activeClass = item.href === activePath ? ' class="active"' : '';
      return `<a${activeClass} href="${item.href}">${escapeHtml(item.label)}</a>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} | Anarchitecture Bricks</title>
  <link rel="stylesheet" href="/assets/site.css" />
</head>
<body>
  <header>
    <h1>Anarchitecture Bricks Docs</h1>
    <p>Repository documentation hub for packages, guides, and generated references.</p>
    <nav>${nav}</nav>
  </header>
  <main>
    ${content}
  </main>
  <footer>
    <small>Generated ${escapeHtml(generatedAt)} UTC by tools/docs-hub/build.mjs</small>
  </footer>
</body>
</html>
`;
}

function renderPackageTable(packages) {
  const rows = packages
    .map((pkg) => {
      const readmeCell = pkg.readmeUrl
        ? `<a href="${pkg.readmeUrl}" target="_blank" rel="noreferrer">README</a>`
        : 'N/A';

      return `<tr>
  <td><code>${escapeHtml(pkg.importPath)}</code></td>
  <td>${escapeHtml(pkg.version)}</td>
  <td>${escapeHtml(pkg.domain)}</td>
  <td>${escapeHtml(pkg.tech)}</td>
  <td><code>${escapeHtml(pkg.packageDir)}</code></td>
  <td>${readmeCell}</td>
</tr>`;
    })
    .join('\n');

  return `<table>
  <thead>
    <tr>
      <th>Package</th>
      <th>Version</th>
      <th>Domain</th>
      <th>Tech</th>
      <th>Path</th>
      <th>README</th>
    </tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>`;
}

function renderPackagesPage(catalog) {
  const groups = new Map();

  for (const pkg of catalog.packages) {
    const domainKey = pkg.domain;
    const techKey = pkg.tech;
    if (!groups.has(domainKey)) {
      groups.set(domainKey, new Map());
    }
    const techMap = groups.get(domainKey);
    if (!techMap.has(techKey)) {
      techMap.set(techKey, []);
    }
    techMap.get(techKey).push(pkg);
  }

  const orderedDomains = [...groups.keys()].sort((left, right) =>
    left.localeCompare(right),
  );

  const sections = orderedDomains
    .map((domain) => {
      const techMap = groups.get(domain);
      const orderedTech = [...techMap.keys()].sort((left, right) =>
        left.localeCompare(right),
      );

      const techSections = orderedTech
        .map((tech) => {
          const packages = techMap.get(tech);
          return `<section>
  <h3>${escapeHtml(domain)} / ${escapeHtml(tech)}</h3>
  ${renderPackageTable(packages)}
</section>`;
        })
        .join('\n');

      return `<section>
  <h2>Domain: ${escapeHtml(domain)}</h2>
  ${techSections}
</section>`;
    })
    .join('\n');

  return `<h2>Package Catalog</h2>
<p>This catalog is generated from <code>libs/**/package.json</code> and <code>libs/**/README.md</code>.</p>
<p>Total packages: <strong>${catalog.packageCount}</strong></p>
${sections}`;
}

function writeFile(relativePath, contents) {
  const targetPath = join(outputRoot, relativePath);
  ensureDir(join(targetPath, '..'));
  writeFileSync(targetPath, contents);
}

const catalog = JSON.parse(readFileSync(catalogFile, 'utf8'));
const generatedAt = new Date().toISOString();

rmSync(outputRoot, { recursive: true, force: true });
ensureDir(join(outputRoot, 'assets'));
ensureDir(join(outputRoot, 'guides'));
ensureDir(join(outputRoot, 'packages'));
ensureDir(join(outputRoot, 'release'));
ensureDir(join(outputRoot, 'data'));

writeFile(
  'assets/site.css',
  `:root {
  --ink: #0f172a;
  --muted: #334155;
  --line: #cbd5e1;
  --bg: #f8fafc;
  --panel: #ffffff;
  --accent: #0f766e;
}
* { box-sizing: border-box; }
body { margin: 0; color: var(--ink); background: linear-gradient(120deg, #f8fafc, #f1f5f9); font-family: "IBM Plex Sans", "Segoe UI", sans-serif; }
header, main, footer { max-width: 1080px; margin: 0 auto; padding: 1rem 1.25rem; }
header h1 { margin: 0; font-size: 1.8rem; }
header p { margin: .5rem 0 1rem; color: var(--muted); }
nav { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: .75rem; }
nav a { text-decoration: none; color: var(--ink); border: 1px solid var(--line); background: var(--panel); padding: .45rem .6rem; border-radius: .5rem; }
nav a.active { border-color: var(--accent); color: var(--accent); }
section, article { background: var(--panel); border: 1px solid var(--line); border-radius: .75rem; padding: 1rem; margin: .75rem 0; }
h2, h3 { margin-top: 0; }
code { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: .92em; }
table { width: 100%; border-collapse: collapse; margin-top: .5rem; }
th, td { text-align: left; border-bottom: 1px solid var(--line); padding: .45rem; vertical-align: top; }
ul { padding-left: 1.2rem; }
footer { color: var(--muted); }
`,
);

writeFile(
  'index.html',
  pageTemplate(
    'Home',
    '/',
    `<section>
  <h2>Docs Entry Point</h2>
  <p>Primary docs hub for package catalog, implementation guides, and generated docs artifacts.</p>
  <ul>
    <li><a href="/packages/">Package catalog</a></li>
    <li><a href="/guides/angular.html">Angular application guide</a></li>
    <li><a href="/guides/nest.html">Nest application guide</a></li>
    <li><a href="/release/">Release and versioning guidance</a></li>
    <li><a href="/storybook/">Storybook UI docs</a></li>
    <li><a href="/openapi/openapi.yaml">OpenAPI YAML</a> and <a href="/openapi/openapi.json">OpenAPI JSON</a></li>
  </ul>
</section>
<section>
  <h2>Architecture</h2>
  <p>Angular layering: <code>ui &lt;- feature -&gt; state -&gt; data-access</code> with <code>config/util</code> shared.</p>
  <p>Nest layering: <code>presentation -&gt; application &lt;- infrastructure</code> with <code>config/util</code> shared.</p>
</section>`,
    generatedAt,
  ),
);

writeFile(
  'packages/index.html',
  pageTemplate('Packages', '/packages/', renderPackagesPage(catalog), generatedAt),
);

writeFile(
  'guides/angular.html',
  pageTemplate(
    'Angular Guide',
    '/guides/angular.html',
    `<article>
  <h2>Build Angular Apps With Bricks</h2>
  <p>Prefer root domain package imports for quick start, then use secondary entry points for advanced composition.</p>
  <ul>
    <li>Provide domain config at app bootstrap using <code>provide*&nbsp;Config</code> helpers.</li>
    <li>Use generated data-access clients instead of manual HTTP calls.</li>
    <li>Register stores explicitly via provider helpers; avoid implicit global state.</li>
    <li>Consume feature components for orchestration and UI components for presentation-only use cases.</li>
  </ul>
  <p>Reference implementation: Storybook stories and Angular example apps in <code>examples/</code>.</p>
</article>`,
    generatedAt,
  ),
);

writeFile(
  'guides/nest.html',
  pageTemplate(
    'Nest Guide',
    '/guides/nest.html',
    `<article>
  <h2>Build Nest Apps With Bricks</h2>
  <p>Use facade modules for minimal setup (<code>forRoot</code>/<code>forRootFromConfig</code>) and layered imports when you need custom composition.</p>
  <ul>
    <li>Keep route schemas in shared TS DTO libraries and controllers limited to pure Fastify schema fields.</li>
    <li>Configure shared infrastructure once at app root (for example mail transport).</li>
    <li>Use domain infrastructure modules as thin adapters over shared contracts.</li>
    <li>For cross-domain persistence links, keep entity models scalar FK-only and use integration schemas for DB FK management.</li>
  </ul>
  <p>API contracts are generated from implementation and published under <a href="/openapi/openapi.yaml">/openapi</a>.</p>
</article>`,
    generatedAt,
  ),
);

writeFile(
  'release/index.html',
  pageTemplate(
    'Release',
    '/release/',
    `<article>
  <h2>Release and Versioning</h2>
  <p>Package releases are manual and domain-scoped using the repository release workflow.</p>
  <ul>
    <li>Run releases from <code>main</code> via <code>.github/workflows/release.yml</code>.</li>
    <li>Use publish recovery only for publish retries via <code>.github/workflows/publish.yml</code>.</li>
    <li>Docs-surface PRs must use non-bumping commit types: <code>docs</code>, <code>chore</code>, <code>ci</code>, <code>style</code>.</li>
  </ul>
  <p>See repository root docs for full release rules and required validation steps.</p>
</article>`,
    generatedAt,
  ),
);

writeFile('data/packages.catalog.json', `${JSON.stringify(catalog, null, 2)}\n`);

console.log(`Docs hub static site generated at ${outputRoot}`);
