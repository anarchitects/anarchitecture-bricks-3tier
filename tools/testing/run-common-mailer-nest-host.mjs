import { nestHostRuntime, nestHostCache } from './nest-host-runtime.mjs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const configuration = process.argv[2];
if (
  !['nest11', 'nest11-config12', 'nest12'].includes(configuration) ||
  process.argv.length !== 3
) {
  throw new Error(
    'Expected exactly one host: nest11, nest11-config12 or nest12',
  );
}

const root = resolve(import.meta.dirname, '../..');
const project = 'libs/common/nest/mailer';
const fixtures = join(root, project, 'tests/hosts', configuration);
const host = mkdtempSync(
  join(tmpdir(), `anarchitects-mailer-${configuration}-`),
);
const { node: hostNode, env, version: hostNodeVersion } = nestHostRuntime();
delete env.NODE_PATH;
delete env.NODE_OPTIONS;
// A developer's mail configuration must not affect the isolated host.
for (const key of Object.keys(env)) {
  if (key.startsWith('MAILER_')) delete env[key];
}
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const run = (command, args, capture = false) =>
  execFileSync(command, args, {
    cwd: host,
    env,
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    encoding: 'utf8',
  });

try {
  const source = readJson(join(root, project, 'package.json'));
  const built = readJson(join(root, 'dist', project, 'package.json'));
  assert.deepEqual(
    built,
    source,
    'Build must preserve the source package contract',
  );
  const [packed] = JSON.parse(
    run(
      'npm',
      [
        'pack',
        join(root, 'dist', project),
        '--json',
        '--ignore-scripts',
        '--cache',
        nestHostCache(host),
      ],
      true,
    ),
  );
  renameSync(join(host, packed.filename), join(host, 'common-mailer.tgz'));
  const packedManifest = JSON.parse(
    run('tar', ['-xOf', 'common-mailer.tgz', 'package/package.json'], true),
  );
  assert.deepEqual(
    packedManifest,
    source,
    'Packing must preserve the source package contract',
  );

  for (const file of ['package.json', 'package-lock.json']) {
    copyFileSync(join(fixtures, `${file}.template`), join(host, file));
  }
  const lock = readJson(join(host, 'package-lock.json'));
  const brick = lock.packages[`node_modules/${source.name}`];
  // Registry artifacts are integrity-locked. Only this freshly built tarball
  // varies: verify its dependency contract, then use its current release version.
  for (const field of ['dependencies', 'peerDependencies']) {
    assert.deepEqual(
      brick[field],
      source[field],
      `Refresh the host lock after changing ${field}`,
    );
  }
  assert.equal(brick.resolved, 'file:common-mailer.tgz');
  assert.equal(brick.integrity, undefined);
  brick.version = source.version;
  writeFileSync(join(host, 'package-lock.json'), JSON.stringify(lock));
  for (const file of [
    'nest-consumer.cts',
    'nest-consumer.cjs',
    'nest-consumer.mts',
  ]) {
    copyFileSync(join(root, project, 'tests', file), join(host, file));
  }
  const tsconfig = readJson(
    join(root, 'tools/testing/nest-hosts/tsconfig.json'),
  );
  tsconfig.files = ['nest-consumer.cts', 'nest-consumer.mts'];
  writeFileSync(join(host, 'tsconfig.json'), JSON.stringify(tsconfig));

  console.log(
    `Common Mailer ${configuration}; Node ${hostNodeVersion}; ${host}`,
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
    nestHostCache(host),
  ]);
  run('npm', ['ls', '--all'], true);
  run('npm', ['ls', '--depth=0']);
  run(hostNode, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json']);
  run(hostNode, ['nest-consumer.cjs']);
  run(hostNode, ['out/nest-consumer.mjs']);
  console.log(`Packed Common Mailer ${configuration} passed.`);
} finally {
  rmSync(host, { recursive: true, force: true });
}
