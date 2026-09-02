import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = resolve(projectRoot, '../../..');
const outputRoot = resolve(workspaceRoot, 'dist/libs/common/tailwind');
const packageJson = JSON.parse(
  readFileSync(resolve(outputRoot, 'package.json'), 'utf8'),
);

assert.equal(packageJson.name, '@anarchitects/tailwind');
assert.equal(packageJson.style, './index.css');
assert.deepEqual(packageJson.exports, {
  '.': './index.css',
  './theme.css': './theme.css',
  './base.css': './base.css',
  './utilities.css': './utilities.css',
  './package.json': './package.json',
});
assert.equal(packageJson.peerDependencies.tailwindcss, '^4.0.0');
assert.equal(packageJson.publishConfig.access, 'public');
assert.equal(packageJson.main, undefined);
assert.equal(packageJson.types, undefined);

for (const file of [
  'index.css',
  'theme.css',
  'base.css',
  'utilities.css',
  'README.md',
]) {
  assert.equal(
    existsSync(resolve(outputRoot, file)),
    true,
    `${file} must be packaged`,
  );
}

const runtimeFiles = readdirSync(outputRoot).filter((file) =>
  /\.[cm]?js$/.test(file),
);
assert.deepEqual(runtimeFiles, []);

console.log('Tailwind package manifest and CSS entry points are valid.');
