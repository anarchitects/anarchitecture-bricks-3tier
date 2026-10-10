import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import semver from 'semver';
import { fixtureDirectory, hostCases } from './nest-compatibility-matrix.mjs';
import { nestHostRuntime } from './nest-host-runtime.mjs';

assert.equal(process.argv.length, 3, 'Expected one suite: nest11 or nest12');
const root = resolve(import.meta.dirname, '../..');
const { version } = nestHostRuntime();
const { cases, exclusions } = hostCases(process.argv[2], version);
for (const exclusion of exclusions) console.log(`EXCLUDED: ${exclusion}`);
// Fail before any installs if a fixture drifts outside the selected runtime.
for (const { family, configuration } of cases) {
  const lock = JSON.parse(
    readFileSync(
      resolve(
        root,
        fixtureDirectory(family, configuration),
        'package-lock.json.template',
      ),
      'utf8',
    ),
  );
  for (const [name, entry] of Object.entries(lock.packages)) {
    if (entry.engines?.node)
      assert.ok(
        semver.satisfies(version, entry.engines.node),
        `${family}/${configuration}: ${name || 'host'} requires Node ${entry.engines.node}, got ${version}`,
      );
  }
}
for (const { family, configuration } of cases) {
  console.log(`\n=== ${family}/${configuration} on Node ${version} ===`);
  await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [`tools/testing/run-${family}-nest-host.mjs`, configuration],
      { cwd: root, stdio: 'inherit', env: process.env },
    );
    child.on('error', reject);
    child.on('exit', (code, signal) =>
      code === 0
        ? resolve()
        : reject(
            new Error(`${family}/${configuration} failed: ${code ?? signal}`),
          ),
    );
  });
}
console.log(
  `Packed ${process.argv[2]} matrix passed: ${cases.length} hosts on ${version}.`,
);
