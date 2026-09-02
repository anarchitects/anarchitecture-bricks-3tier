import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const workspaceRoot = process.cwd();
const libsRoot = join(workspaceRoot, 'libs');
const guideFiles = [
  { path: 'docs/guides/angular.md', key: 'angular' },
  { path: 'docs/guides/nest.md', key: 'nest' },
  { path: 'docs/guides/ts-contracts.md', key: 'tsContracts' },
  { path: 'docs/guides/design-ui-systems.md', key: 'designUiSystems' },
  { path: 'docs/guides/ai-agents.md', key: 'aiAgents' },
];

const guideRequirements = {
  angular: [
    'intent',
    'architecture',
    'easy mode with root exports',
    'advanced mode with secondary entry points',
    'ts contract integration',
    'layout cookbook',
    'state data access',
    'testing and docs workflow',
    'common pitfalls',
  ],
  nest: [
    'intent',
    'architecture',
    'easy mode with composition modules',
    'advanced mode with layer entry points',
    'ts contract integration',
    'library entry point cookbook',
    'schema evolution and compatibility',
    'contract verification workflow',
    'common pitfalls',
  ],
  tsContracts: [
    'intent',
    'contract ownership model',
    'domain contract matrix',
    'forms ts contracts',
    'auth ts contracts',
    'consumer mapping angular and nest',
    'contract change workflow',
    'compatibility rules',
    'verification checklist',
  ],
  designUiSystems: [
    'intent',
    'system layers',
    'token and theme model',
    'composition contracts',
    'primitive contracts',
    'layout runtime contracts',
    'domain integration matrix',
    'cookbook patterns',
    'anti patterns',
    'adoption checklist',
  ],
  aiAgents: [
    'intent',
    'applicability nx and non nx',
    'bricks core overlay',
    'angular packages overlay',
    'nest packages overlay',
    'release safety overlay',
    'placement patterns',
  ],
};

const aiGuideRequiredMentions = [
  { label: 'AGENTS.md mention', token: 'AGENTS.md' },
  { label: 'CLAUDE.md mention', token: 'CLAUDE.md' },
  { label: 'GEMINI.md mention', token: 'GEMINI.md' },
  {
    label: '.github/copilot-instructions.md mention',
    token: '.github/copilot-instructions.md',
  },
];

const aiGuideRequiredPackageTokens = [
  { label: '@anarchitects package namespace', token: '@anarchitects/' },
  {
    label: 'Angular layering rule',
    token: 'ui <- feature -> state -> data-access',
  },
  {
    label: 'Nest layering rule',
    token: 'presentation -> application <- infrastructure',
  },
];

const aiGuideRequiredBlocks = [
  {
    label: 'AGENTS.md overlay fenced block',
    pattern: /###\s+AGENTS\.md[\s\S]*?```(?:md)?[\s\S]*?```/i,
  },
  {
    label: 'CLAUDE.md overlay fenced block',
    pattern: /###\s+CLAUDE\.md[\s\S]*?```(?:md)?[\s\S]*?```/i,
  },
  {
    label: 'GEMINI.md overlay fenced block',
    pattern: /###\s+GEMINI\.md[\s\S]*?```(?:md)?[\s\S]*?```/i,
  },
  {
    label: '.github/copilot-instructions.md overlay fenced block',
    pattern:
      /###\s+\.github\/copilot-instructions\.md[\s\S]*?```(?:md)?[\s\S]*?```/i,
  },
];

const designUiSystemsRequiredTokens = [
  '@anarchitects/tailwind',
  '@anarchitects/common-angular-design',
  '@anarchitects/common-angular-ui-composition',
  '@anarchitects/common-angular-ui-primitives',
  '@anarchitects/common-angular-ui-layouts',
  '@anarchitects/forms-angular',
  '@anarchitects/auth-angular',
  'ui <- feature -> state -> data-access',
  'presentation -> application <- infrastructure',
];

const requiredDesignGuideLink = '/guides/design-ui-systems.html';
const requiredTsGuideLink = '/guides/ts-contracts.html';
const forbiddenSharedHeadingsInFrameworkGuides = [
  'system layers',
  'token and theme model',
  'composition contracts',
  'primitive contracts',
  'layout runtime contracts',
  'domain integration matrix',
];
const forbiddenTsCanonicalHeadingsInFrameworkGuides = [
  'contract ownership model',
  'domain contract matrix',
  'forms ts contracts',
  'auth ts contracts',
];
const tsContractsRequiredTokens = [
  '@anarchitects/forms-ts',
  '@anarchitects/auth-ts',
  '@anarchitects/forms-angular',
  '@anarchitects/auth-angular',
  '@anarchitects/forms-nest',
  '@anarchitects/auth-nest',
];

function walkFiles(rootDir, targetName) {
  const stack = [rootDir];
  const files = [];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (entry.isFile() && entry.name === targetName) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function normalizeHeading(value) {
  return value
    .toLowerCase()
    .replace(/[`*_]/g, '')
    .replace(/\//g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHeadings(markdownContent) {
  return [...markdownContent.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => {
    const raw = match[1].replace(/\s+#*$/, '').trim();
    return normalizeHeading(raw);
  });
}

function hasHeading(headings, expected) {
  return headings.some(
    (heading) =>
      heading === expected ||
      heading.startsWith(`${expected} `) ||
      heading.includes(` ${expected} `),
  );
}

function collectPublishableReadmes() {
  const packageJsonFiles = walkFiles(libsRoot, 'package.json');
  const readmes = [];

  for (const packageJsonFile of packageJsonFiles) {
    const packageJson = JSON.parse(readFileSync(packageJsonFile, 'utf8'));
    if (!packageJson.publishConfig) {
      continue;
    }

    const packageDir = join(packageJsonFile, '..');
    const readmeFile = join(packageDir, 'README.md');
    if (!existsSync(readmeFile)) {
      readmes.push({
        packageName: packageJson.name ?? relative(workspaceRoot, packageDir),
        readmePath: relative(workspaceRoot, readmeFile).replaceAll('\\', '/'),
        missingFile: true,
      });
      continue;
    }

    readmes.push({
      packageName: packageJson.name ?? relative(workspaceRoot, packageDir),
      readmePath: relative(workspaceRoot, readmeFile).replaceAll('\\', '/'),
      missingFile: false,
    });
  }

  return readmes.sort((left, right) =>
    left.packageName.localeCompare(right.packageName),
  );
}

const failures = [];
const guideContents = new Map();

for (const guide of guideFiles) {
  const absolutePath = join(workspaceRoot, guide.path);
  if (!existsSync(absolutePath)) {
    failures.push(`${guide.path}: missing guide markdown file.`);
    continue;
  }

  const markdownContent = readFileSync(absolutePath, 'utf8');
  guideContents.set(guide.key, markdownContent);
  const headings = extractHeadings(markdownContent);
  const missing = guideRequirements[guide.key].filter((requiredHeading) => {
    return !hasHeading(headings, requiredHeading);
  });

  if (missing.length > 0) {
    failures.push(
      `${guide.path}: missing required headings -> ${missing
        .map((value) => `"${value}"`)
        .join(', ')}`,
    );
  }

  if (guide.key === 'aiAgents') {
    const normalizedMarkdown = markdownContent.toLowerCase();
    const missingMentions = aiGuideRequiredMentions
      .filter(
        (entry) => !normalizedMarkdown.includes(entry.token.toLowerCase()),
      )
      .map((entry) => `"${entry.label}"`);

    if (missingMentions.length > 0) {
      failures.push(
        `${guide.path}: missing required file target mentions -> ${missingMentions.join(', ')}`,
      );
    }

    const missingPackageTokens = aiGuideRequiredPackageTokens
      .filter(
        (entry) => !normalizedMarkdown.includes(entry.token.toLowerCase()),
      )
      .map((entry) => `"${entry.label}"`);

    if (missingPackageTokens.length > 0) {
      failures.push(
        `${guide.path}: missing required package overlay tokens -> ${missingPackageTokens.join(', ')}`,
      );
    }

    const missingBlocks = aiGuideRequiredBlocks
      .filter((entry) => !entry.pattern.test(markdownContent))
      .map((entry) => `"${entry.label}"`);

    if (missingBlocks.length > 0) {
      failures.push(
        `${guide.path}: missing required fenced template blocks -> ${missingBlocks.join(', ')}`,
      );
    }
  }

  if (guide.key === 'angular' || guide.key === 'nest') {
    const normalizedMarkdown = markdownContent.toLowerCase();
    if (!normalizedMarkdown.includes(requiredDesignGuideLink)) {
      failures.push(
        `${guide.path}: missing required canonical guide link ("${requiredDesignGuideLink}").`,
      );
    }
    if (!normalizedMarkdown.includes(requiredTsGuideLink)) {
      failures.push(
        `${guide.path}: missing required canonical guide link ("${requiredTsGuideLink}").`,
      );
    }

    const duplicatedSharedHeadings = forbiddenSharedHeadingsInFrameworkGuides
      .filter((heading) => headings.includes(heading))
      .map((heading) => `"${heading}"`);

    if (duplicatedSharedHeadings.length > 0) {
      failures.push(
        `${guide.path}: contains forbidden duplicated shared headings -> ${duplicatedSharedHeadings.join(', ')}`,
      );
    }

    const duplicatedTsCanonicalHeadings =
      forbiddenTsCanonicalHeadingsInFrameworkGuides
        .filter((heading) => headings.includes(heading))
        .map((heading) => `"${heading}"`);

    if (duplicatedTsCanonicalHeadings.length > 0) {
      failures.push(
        `${guide.path}: contains forbidden duplicated TS-canonical headings -> ${duplicatedTsCanonicalHeadings.join(', ')}`,
      );
    }
  }

  if (guide.key === 'designUiSystems') {
    const normalizedMarkdown = markdownContent.toLowerCase();
    if (!normalizedMarkdown.includes(requiredTsGuideLink)) {
      failures.push(
        `${guide.path}: missing required link to TS contracts guide ("${requiredTsGuideLink}").`,
      );
    }
  }
}

const designUiSystemsContent = (
  guideContents.get('designUiSystems') ?? ''
).toLowerCase();
const missingCoverageTokens = designUiSystemsRequiredTokens
  .filter((token) => !designUiSystemsContent.includes(token.toLowerCase()))
  .map((token) => `"${token}"`);

if (missingCoverageTokens.length > 0) {
  failures.push(
    `docs/guides/design-ui-systems.md: missing required canonical design/ui coverage tokens -> ${missingCoverageTokens.join(', ')}`,
  );
}

const tsContractsContent = (
  guideContents.get('tsContracts') ?? ''
).toLowerCase();
const missingTsCoverageTokens = tsContractsRequiredTokens
  .filter((token) => !tsContractsContent.includes(token.toLowerCase()))
  .map((token) => `"${token}"`);

if (missingTsCoverageTokens.length > 0) {
  failures.push(
    `docs/guides/ts-contracts.md: missing required canonical TS coverage tokens -> ${missingTsCoverageTokens.join(', ')}`,
  );
}

const packageReadmes = collectPublishableReadmes();
for (const pkg of packageReadmes) {
  if (pkg.missingFile) {
    failures.push(
      `${pkg.packageName}: missing README file (${pkg.readmePath}).`,
    );
    continue;
  }

  const absolutePath = join(workspaceRoot, pkg.readmePath);
  const headings = extractHeadings(readFileSync(absolutePath, 'utf8'));

  const missing = [];
  if (!hasHeading(headings, 'features')) {
    missing.push('"Features"');
  }
  if (!hasHeading(headings, 'installation')) {
    missing.push('"Installation"');
  }
  if (!hasHeading(headings, 'usage')) {
    missing.push('"Usage"');
  }
  if (
    !hasHeading(headings, 'exports') &&
    !hasHeading(headings, 'entry points')
  ) {
    missing.push('"Exports" or "Entry points"');
  }
  if (
    !hasHeading(headings, 'configuration') &&
    !hasHeading(headings, 'development notes')
  ) {
    missing.push('"Configuration" or "Development notes"');
  }

  if (missing.length > 0) {
    failures.push(
      `${pkg.readmePath}: missing required headings -> ${missing.join(', ')}`,
    );
  }
}

if (failures.length > 0) {
  console.error('Docs content validation failed.');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Docs content validation passed for ${guideFiles.length} guides (including AI agent overlays) and ${packageReadmes.length} publishable package READMEs.`,
);
