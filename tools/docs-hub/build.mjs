import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';

const workspaceRoot = process.cwd();
const catalogFile = join(workspaceRoot, 'dist/docs-hub/data/packages.catalog.json');
const outputRoot = join(workspaceRoot, 'dist/docs-hub');
const angularGuidePath = join(workspaceRoot, 'docs/guides/angular.md');
const nestGuidePath = join(workspaceRoot, 'docs/guides/nest.md');
const aiAgentsGuidePath = join(workspaceRoot, 'docs/guides/ai-agents.md');
const designUiSystemsGuidePath = join(workspaceRoot, 'docs/guides/design-ui-systems.md');
const tsContractsGuidePath = join(workspaceRoot, 'docs/guides/ts-contracts.md');

marked.setOptions({
  gfm: true,
  breaks: false,
});

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

function markdownToHtml(markdownContent) {
  return marked.parse(markdownContent);
}

function pageTemplate(title, activePath, content, generatedAt) {
  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/packages/', label: 'Packages' },
    { href: '/guides/angular.html', label: 'Angular Guide' },
    { href: '/guides/nest.html', label: 'Nest Guide' },
    { href: '/guides/ts-contracts.html', label: 'TS Contracts Guide' },
    { href: '/guides/design-ui-systems.html', label: 'Design/UI Systems Guide' },
    { href: '/guides/ai-agents.html', label: 'AI Agents Guide' },
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

function writeFile(relativePath, contents) {
  const targetPath = join(outputRoot, relativePath);
  ensureDir(join(targetPath, '..'));
  writeFileSync(targetPath, contents);
}

function renderPackageTable(packages) {
  const rows = packages
    .map((pkg) => {
      const renderedCell = pkg.renderedReadmeUrl
        ? `<a href="${pkg.renderedReadmeUrl}">Rendered</a>`
        : 'N/A';
      const sourceCell = pkg.sourceReadmeUrl
        ? `<a href="${pkg.sourceReadmeUrl}" target="_blank" rel="noreferrer">Source README</a>`
        : 'N/A';

      return `<tr>
  <td><code>${escapeHtml(pkg.importPath)}</code></td>
  <td>${escapeHtml(pkg.version)}</td>
  <td>${escapeHtml(pkg.domain)}</td>
  <td>${escapeHtml(pkg.tech)}</td>
  <td>${renderedCell}</td>
  <td>${sourceCell}</td>
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
      <th>Rendered Docs</th>
      <th>Source README</th>
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

  return `<h2>Publishable Package Catalog</h2>
<p>This catalog is generated from publishable package metadata under <code>libs/**/package.json</code>.</p>
<p>Total publishable packages: <strong>${catalog.packageCount}</strong></p>
${sections}`;
}

function renderMarkdownPage(title, activePath, markdownContent, generatedAt) {
  return pageTemplate(
    title,
    activePath,
    `<article class="markdown-body">${markdownToHtml(markdownContent)}</article>`,
    generatedAt,
  );
}

const catalog = JSON.parse(readFileSync(catalogFile, 'utf8'));
const generatedAt = new Date().toISOString();
const angularGuideMarkdown = readFileSync(angularGuidePath, 'utf8');
const nestGuideMarkdown = readFileSync(nestGuidePath, 'utf8');
const aiAgentsGuideMarkdown = readFileSync(aiAgentsGuidePath, 'utf8');
const designUiSystemsGuideMarkdown = readFileSync(designUiSystemsGuidePath, 'utf8');
const tsContractsGuideMarkdown = readFileSync(tsContractsGuidePath, 'utf8');

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
  --code-bg: #f1f5f9;
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
code { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: .92em; background: var(--code-bg); padding: .06rem .25rem; border-radius: .25rem; }
pre code { display: block; padding: 1rem; overflow-x: auto; line-height: 1.4; }
table { width: 100%; border-collapse: collapse; margin-top: .5rem; }
th, td { text-align: left; border-bottom: 1px solid var(--line); padding: .45rem; vertical-align: top; }
ul { padding-left: 1.2rem; }
footer { color: var(--muted); }
.markdown-body h1, .markdown-body h2, .markdown-body h3 { margin-top: 1.4rem; }
.markdown-body h1:first-child, .markdown-body h2:first-child, .markdown-body h3:first-child { margin-top: 0; }
.markdown-body a { color: var(--accent); }
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
    <li><a href="/packages/">Publishable package catalog</a></li>
    <li><a href="/guides/angular.html">Angular application guide</a></li>
    <li><a href="/guides/nest.html">Nest application guide</a></li>
    <li><a href="/guides/ts-contracts.html">TS contracts guide</a></li>
    <li><a href="/guides/design-ui-systems.html">Design/UI systems guide</a></li>
    <li><a href="/guides/ai-agents.html">AI coding agents templates</a></li>
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

for (const pkg of catalog.packages) {
  if (!pkg.readmePath || !pkg.renderedReadmeUrl) {
    continue;
  }

  const readmeMarkdown = readFileSync(join(workspaceRoot, pkg.readmePath), 'utf8');
  const body = `<article class="markdown-body">${markdownToHtml(readmeMarkdown)}</article>
<section>
  <h2>Source Links</h2>
  <ul>
    <li><a href="/packages/">Back to package catalog</a></li>
    ${
      pkg.sourceReadmeUrl
        ? `<li><a href="${pkg.sourceReadmeUrl}" target="_blank" rel="noreferrer">Source README on GitHub</a></li>`
        : ''
    }
  </ul>
</section>`;
  writeFile(
    `packages/${pkg.slug}/index.html`,
    pageTemplate(pkg.importPath, '/packages/', body, generatedAt),
  );
}

writeFile(
  'guides/angular.html',
  renderMarkdownPage(
    'Angular Guide',
    '/guides/angular.html',
    angularGuideMarkdown,
    generatedAt,
  ),
);

writeFile(
  'guides/nest.html',
  renderMarkdownPage('Nest Guide', '/guides/nest.html', nestGuideMarkdown, generatedAt),
);

writeFile(
  'guides/ts-contracts.html',
  renderMarkdownPage(
    'TS Contracts Guide',
    '/guides/ts-contracts.html',
    tsContractsGuideMarkdown,
    generatedAt,
  ),
);

writeFile(
  'guides/ai-agents.html',
  renderMarkdownPage(
    'AI Agents Guide',
    '/guides/ai-agents.html',
    aiAgentsGuideMarkdown,
    generatedAt,
  ),
);

writeFile(
  'guides/design-ui-systems.html',
  renderMarkdownPage(
    'Design/UI Systems Guide',
    '/guides/design-ui-systems.html',
    designUiSystemsGuideMarkdown,
    generatedAt,
  ),
);

writeFile(
  'release/index.html',
  pageTemplate(
    'Release',
    '/release/',
    `<article class="markdown-body">
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
writeFile('guides/angular.md', angularGuideMarkdown);
writeFile('guides/nest.md', nestGuideMarkdown);
writeFile('guides/ts-contracts.md', tsContractsGuideMarkdown);
writeFile('guides/ai-agents.md', aiAgentsGuideMarkdown);
writeFile('guides/design-ui-systems.md', designUiSystemsGuideMarkdown);

console.log(
  `Docs hub static site generated at ${outputRoot} with ${catalog.packageCount} publishable packages.`,
);
