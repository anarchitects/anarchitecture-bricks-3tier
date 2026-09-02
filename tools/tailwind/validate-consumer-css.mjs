import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const target = process.argv
  .find((argument) => argument.startsWith('--target='))
  ?.slice(9);

const contracts = {
  forms: {
    outputRoot: 'dist/examples/forms-angular-example/browser',
    extensions: new Set(['.css']),
    expected: [
      '.anx-stack',
      '.anx-surface',
      '.bg-anx-canvas',
      '.text-anx-accent',
      '[data-density=comfortable]',
      ':focus-visible',
      'prefers-reduced-motion',
    ],
  },
  auth: {
    outputRoot: 'dist/examples/auth-angular-example/browser',
    extensions: new Set(['.css']),
    expected: [
      '.anx-cluster',
      '.anx-surface',
      '.bg-anx-canvas',
      '.border-anx-border',
      '--color-anx-accent: oklch(.64 .18 235)',
      '--anx-color-accent: oklch(.64 .18 235)',
      '[data-density=compact]',
      ':focus-visible',
    ],
  },
  storybook: {
    outputRoot: 'dist/storybook/storybook-angular',
    extensions: new Set(['.js']),
    expected: [
      '.anx-storybook-frame',
      '.anx-stack',
      '.bg-anx-canvas',
      "[data-theme='dark']",
      "[data-density='compact']",
      ':focus-visible',
      'prefers-reduced-motion',
    ],
  },
};

assert.ok(
  target && target in contracts,
  'Expected --target=forms|auth|storybook.',
);

const contract = contracts[target];
const outputRoot = resolve(contract.outputRoot);
assert.equal(
  existsSync(outputRoot),
  true,
  `Missing production output at ${outputRoot}.`,
);

const files = collectFiles(outputRoot, contract.extensions);
assert.ok(files.length > 0, `No generated assets found in ${outputRoot}.`);

const output = files.map((file) => readFileSync(file, 'utf8')).join('\n');

for (const token of contract.expected) {
  assert.equal(
    output.includes(token),
    true,
    `${target} production output must contain ${token}.`,
  );
}

assert.equal(
  output.includes('.translate-x-96'),
  false,
  `${target} production output must not contain an unused Tailwind utility.`,
);

console.log(
  `${target} Tailwind production CSS contract passed across ${files.length} generated asset(s).`,
);

function collectFiles(directory, extensions) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectFiles(path, extensions);
    }

    return extensions.has(extname(entry.name)) ? [path] : [];
  });
}
