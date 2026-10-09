import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const major = process.argv[2];
if (!['11', '12'].includes(major) || process.argv.length !== 3) {
  throw new Error('Expected exactly one Nest major: 11 or 12');
}

const fixtures = join(import.meta.dirname, 'nest-hosts');
const host = mkdtempSync(join(tmpdir(), `anarchitects-nest-${major}-host-`));
const env = { ...process.env };
// Avoid resolving workspace modules or injecting workspace loaders into the host.
delete env.NODE_PATH;
delete env.NODE_OPTIONS;

function run(command, args) {
  execFileSync(command, args, { cwd: host, env, stdio: 'inherit' });
}

try {
  for (const file of ['package.json', 'package-lock.json']) {
    copyFileSync(join(fixtures, major, `${file}.template`), join(host, file));
  }
  for (const file of [
    'probe.cts',
    'probe-cjs.cjs',
    'probe-esm.mjs',
    'tsconfig.json',
  ]) {
    copyFileSync(join(fixtures, file), join(host, file));
  }
  console.log(
    `Nest ${major} development host; Node ${process.version}; ${host}`,
  );
  run('npm', [
    'ci',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--strict-peer-deps',
    '--legacy-peer-deps=false',
    '--force=false',
    '--engine-strict',
    '--cache',
    join(host, '.npm-cache'),
  ]);
  run(process.execPath, [
    'node_modules/typescript/bin/tsc',
    '-p',
    'tsconfig.json',
  ]);
  run(process.execPath, ['probe-cjs.cjs']);
  run(process.execPath, ['probe-esm.mjs']);
  console.log(
    `Nest ${major} upstream host passed; brick compatibility remains unverified.`,
  );
} finally {
  rmSync(host, { recursive: true, force: true });
}
