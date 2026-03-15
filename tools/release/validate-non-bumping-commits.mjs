import { spawnSync } from 'node:child_process';

const workspaceRoot = process.cwd();
const allowedTypes = new Set(['docs', 'chore', 'ci', 'style']);
const docsPathMatchers = [
  /^docs\//,
  /^tools\/angular-docs\//,
  /^tools\/docs-hub\//,
  /^libs\/.+\/README\.md$/,
  /^README\.md$/,
  /^CONTRIBUTING\.md$/,
  /^\.github\/workflows\/docs-pages\.yml$/,
];

function runGit(args) {
  const result = spawnSync('git', args, {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    throw new Error(`git ${args.join(' ')} failed${stderr ? `: ${stderr}` : ''}`);
  }

  return result.stdout.trim();
}

function resolveBaseRef() {
  const baseRef = process.env.GITHUB_BASE_REF || 'main';
  const candidates = [`origin/${baseRef}`, 'origin/main'];

  for (const candidate of candidates) {
    const result = spawnSync('git', ['rev-parse', '--verify', '--quiet', candidate], {
      cwd: workspaceRoot,
      encoding: 'utf8',
    });
    if (result.status === 0) {
      return candidate;
    }
  }

  throw new Error('Unable to resolve base ref (expected origin/<base> or origin/main).');
}

function changedDocsSurface(files) {
  return files.some((filePath) => docsPathMatchers.some((matcher) => matcher.test(filePath)));
}

function parseCommitBlocks(rawLog) {
  if (!rawLog) {
    return [];
  }

  return rawLog
    .split('\u001e')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [hash, subject, body = ''] = entry.split('\u001f');
      return { hash, subject: subject ?? '', body: body ?? '' };
    });
}

function extractType(subject) {
  const match = /^([a-z]+)(\([^)]+\))?(!)?:\s+.+$/.exec(subject);
  if (!match) {
    return { type: null, breakingBang: false };
  }

  return {
    type: match[1],
    breakingBang: Boolean(match[3]),
  };
}

const baseRef = resolveBaseRef();
const changedFilesRaw = runGit(['diff', '--name-only', `${baseRef}...HEAD`]);
const changedFiles = changedFilesRaw
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean);

if (changedFiles.length === 0) {
  console.log('No changed files in PR range; skipping non-bumping commit validation.');
  process.exit(0);
}

if (!changedDocsSurface(changedFiles)) {
  console.log('No docs-surface file changes detected; skipping non-bumping commit validation.');
  process.exit(0);
}

const rawLog = runGit([
  'log',
  '--format=%H%x1f%s%x1f%b%x1e',
  `${baseRef}...HEAD`,
]);
const commits = parseCommitBlocks(rawLog);

if (commits.length === 0) {
  console.log('No commits found in PR range; skipping non-bumping commit validation.');
  process.exit(0);
}

const violations = [];

for (const commit of commits) {
  if (commit.subject.startsWith('Merge ')) {
    continue;
  }

  const { type, breakingBang } = extractType(commit.subject);
  const breakingFooter = /BREAKING[ -]CHANGE/i.test(commit.body);
  const revertHeader = /^revert(\(.+\))?:\s+/i.test(commit.subject);

  if (!type) {
    violations.push(
      `${commit.hash.slice(0, 8)} invalid conventional subject for docs-surface PR: "${commit.subject}"`,
    );
    continue;
  }

  if (revertHeader) {
    violations.push(`${commit.hash.slice(0, 8)} uses disallowed revert commit type.`);
  }

  if (breakingBang || breakingFooter) {
    violations.push(
      `${commit.hash.slice(0, 8)} contains breaking-change markers ("!" or BREAKING CHANGE).`,
    );
  }

  if (!allowedTypes.has(type)) {
    violations.push(
      `${commit.hash.slice(0, 8)} uses disallowed commit type "${type}" for docs-surface PRs.`,
    );
  }
}

if (violations.length > 0) {
  console.error('Non-bumping commit validation failed for docs-surface changes.');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  console.error(
    'Use docs/chore/ci/style commit types only and avoid "!" / BREAKING CHANGE markers.',
  );
  process.exit(1);
}

console.log(
  `Non-bumping commit validation passed for ${commits.length} commit(s) with docs-surface changes.`,
);
