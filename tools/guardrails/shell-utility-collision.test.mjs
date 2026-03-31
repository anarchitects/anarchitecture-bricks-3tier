import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = join(__dirname, '../../');

/**
 * Guardrail verification: Cross-package shell utility collision prevention.
 *
 * This test ensures that ui-layouts and ui-primitives packages do not use
 * shell-only utility classes on their component host elements.
 *
 * Shell utilities (anx-region, anx-stack, anx-inline, anx-grid) are intended
 * for consumer/app-shell layout control only. Applying them to package component
 * hosts creates spacing collisions when nested inside consumer layout containers.
 *
 * Violations Found In:
 * - Host binding usage: `host: { class: 'anx-component anx-stack' }`
 * - Template usage: `<div class="anx-stack">` or `[class.anx-stack]="true"`
 *
 * Exclusions:
 * - Files matching **\/*.stories.ts (intentional consumer demo wrappers)
 * - Files matching **\/*.spec.ts (test harness wrappers)
 */

const SHELL_UTILITY_CLASSNAMES = {
  region: 'anx-region',
  stack: 'anx-stack',
  inline: 'anx-inline',
  grid: 'anx-grid',
};

const SHELL_UTILITY_NAMES = Object.values(SHELL_UTILITY_CLASSNAMES);
const SHELL_UTILITY_PATTERN = new RegExp(
  `\\b(${SHELL_UTILITY_NAMES.join('|')})\\b`,
  'g',
);

/**
 * Recursively scan directory for TypeScript and template files,
 * excluding spec and story files.
 */
function scanDirectory(dir, basePath = '') {
  const files = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        // Skip node_modules, dist, and hidden directories
        if (
          ['.', 'node_modules', 'dist', '.nx', 'coverage'].includes(entry.name)
        ) {
          continue;
        }
        files.push(...scanDirectory(fullPath, relativePath));
      } else if (entry.isFile()) {
        // Include .ts and .html files, exclude .spec.ts and .stories.ts
        if (
          (entry.name.endsWith('.ts') || entry.name.endsWith('.html')) &&
          !entry.name.endsWith('.spec.ts') &&
          !entry.name.endsWith('.stories.ts')
        ) {
          try {
            const content = readFileSync(fullPath, 'utf-8');
            files.push({ path: relativePath, content });
          } catch {
            // Skip files that cannot be read
          }
        }
      }
    }
  } catch {
    // Skip directories that cannot be accessed
  }

  return files;
}

/**
 * Find violations of shell utility class usage in source files.
 */
function findViolations(files) {
  const violations = [];

  for (const { path, content } of files) {
    const lines = content.split('\n');

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      let match;

      // Check each line for shell utility class names
      // eslint-disable-next-line no-cond-assign
      while ((match = SHELL_UTILITY_PATTERN.exec(line)) !== null) {
        const className = match[0];

        // Verify it's a real shell utility class (avoid false positives)
        if (isShellUtilityClass(className)) {
          violations.push({
            file: path,
            line: lineNum + 1,
            content: line.trim(),
            className,
          });
        }
      }

      // Reset regex for next line
      SHELL_UTILITY_PATTERN.lastIndex = 0;
    }
  }

  return violations;
}

/**
 * Type guard: verify string is a known shell utility class.
 */
function isShellUtilityClass(value) {
  return SHELL_UTILITY_NAMES.includes(value);
}

/**
 * Format violations for readable error output.
 */
function formatViolationReport(violations) {
  if (violations.length === 0) {
    return null;
  }

  const report = violations
    .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
    .map((v) => `  [${v.file}:${v.line}] ${v.className}\n    ${v.content}`)
    .join('\n');

  return report;
}

test('guardrail: ui-layouts should not use shell utilities in host bindings or templates', (t) => {
  const packagePath = join(workspaceRoot, 'libs/common/angular/ui-layouts');
  const files = scanDirectory(packagePath);
  const violations = findViolations(files);

  if (violations.length > 0) {
    const report = formatViolationReport(violations);
    t.diagnostic(
      `Found ${violations.length} violation(s) in ui-layouts:\n${report}`,
    );
  }

  assert.equal(
    violations.length,
    0,
    `Expected no shell utility violations in ui-layouts, but found ${violations.length}`,
  );
});

test('guardrail: ui-primitives should not use shell utilities in host bindings or templates', (t) => {
  const packagePath = join(workspaceRoot, 'libs/common/angular/ui-primitives');
  const files = scanDirectory(packagePath);
  const violations = findViolations(files);

  if (violations.length > 0) {
    const report = formatViolationReport(violations);
    t.diagnostic(
      `Found ${violations.length} violation(s) in ui-primitives:\n${report}`,
    );
  }

  assert.equal(
    violations.length,
    0,
    `Expected no shell utility violations in ui-primitives, but found ${violations.length}`,
  );
});
