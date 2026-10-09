import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import {
  cpSync,
  copyFileSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { GenericContainer, Wait } from 'testcontainers';

const configuration = process.argv[2];
const refresh = process.argv[3] === '--refresh-lock';
if (
  !['nest11', 'nest11-modern', 'nest12'].includes(configuration) ||
  process.argv.length !== (refresh ? 4 : 3)
) {
  throw new Error(
    'Expected host nest11, nest11-modern or nest12, optionally --refresh-lock',
  );
}
const root = resolve(import.meta.dirname, '../..');
const fixtures = join(import.meta.dirname, 'forms-identity-nest-hosts');
const host = mkdtempSync(
  join(tmpdir(), `anarchitects-forms-identity-${configuration}-`),
);
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (
    key === 'NODE_PATH' ||
    key === 'NODE_OPTIONS' ||
    key.startsWith('FORMS_') ||
    key.startsWith('IDENTITY_') ||
    key.startsWith('MAILER_')
  )
    delete env[key];
}
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const run = (command, args, capture = false) =>
  execFileSync(command, args, {
    cwd: host,
    env,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
  });
const runAsync = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: host, env, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code, signal) =>
      code === 0
        ? resolve()
        : reject(new Error(`Consumer exited ${code ?? signal}`)),
    );
  });
let container;
try {
  const contracts = new Map();
  for (const candidate of readJson(join(fixtures, 'candidates.json'))) {
    const source = readJson(join(root, candidate.root, 'package.json'));
    const built = readJson(join(root, 'dist', candidate.root, 'package.json'));
    for (const field of [
      'name',
      'version',
      'type',
      'main',
      'types',
      'dependencies',
      'peerDependencies',
      'engines',
    ]) {
      assert.deepEqual(
        built[field],
        source[field],
        `${source.name}: source/build ${field}`,
      );
    }
    if (source.exports) assert.deepEqual(built.exports, source.exports);
    const staging = join(host, 'staging', source.name.split('/')[1]);
    cpSync(join(root, 'dist', candidate.root), staging, { recursive: true });
    // Rehearse the upcoming minor releases without changing source versions,
    // dependency ranges, exports, runtime code or any third-party package.
    const manifest = { ...built, version: candidate.version };
    writeFileSync(join(staging, 'package.json'), JSON.stringify(manifest));
    const [packed] = JSON.parse(
      run(
        'npm',
        [
          'pack',
          staging,
          '--json',
          '--ignore-scripts',
          '--cache',
          join(host, '.npm-cache'),
        ],
        true,
      ),
    );
    renameSync(join(host, packed.filename), join(host, candidate.archive));
    const actual = JSON.parse(
      run('tar', ['-xOf', candidate.archive, 'package/package.json'], true),
    );
    assert.deepEqual(actual, manifest, `${source.name}: packed manifest`);
    contracts.set(source.name, manifest);
  }
  copyFileSync(
    join(fixtures, configuration, 'package.json.template'),
    join(host, 'package.json'),
  );
  const npmFlags = [
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--strict-peer-deps',
    '--legacy-peer-deps=false',
    '--force=false',
    '--engine-strict',
    '--cache',
    join(host, '.npm-cache'),
  ];
  if (refresh) {
    run('npm', ['install', '--package-lock-only', ...npmFlags]);
    const lock = readJson(join(host, 'package-lock.json'));
    for (const name of contracts.keys())
      delete lock.packages[`node_modules/${name}`].integrity;
    writeFileSync(
      join(fixtures, configuration, 'package-lock.json.template'),
      JSON.stringify(lock, null, 2) + '\n',
    );
    console.log(
      `Refreshed ${configuration}; run the normal target to validate it.`,
    );
  } else {
    const lock = readJson(
      join(fixtures, configuration, 'package-lock.json.template'),
    );
    for (const [name, manifest] of contracts) {
      const entry = lock.packages[`node_modules/${name}`];
      for (const field of [
        'version',
        'dependencies',
        'peerDependencies',
        'engines',
      ])
        assert.deepEqual(
          entry[field],
          manifest[field],
          `${name}: refresh lock ${field}`,
        );
      assert.equal(entry.integrity, undefined);
      assert.match(entry.resolved, /^file:[\w-]+\.tgz$/);
    }
    writeFileSync(join(host, 'package-lock.json'), JSON.stringify(lock));
    for (const file of ['consumer.cts', 'consumer.mts', 'run-consumer.mjs'])
      copyFileSync(join(fixtures, file), join(host, file));
    const tsconfig = readJson(
      join(import.meta.dirname, 'nest-hosts/tsconfig.json'),
    );
    tsconfig.files = ['consumer.cts', 'consumer.mts'];
    writeFileSync(join(host, 'tsconfig.json'), JSON.stringify(tsconfig));
    console.log(
      `Forms/Identity ${configuration}; Node ${process.version}; ${host}`,
    );
    run('npm', ['ci', ...npmFlags]);
    run('npm', ['ls', '--all'], true);
    run('npm', ['ls', '--depth=0']);
    run(process.execPath, [
      'node_modules/typescript/bin/tsc',
      '-p',
      'tsconfig.json',
    ]);
    run(process.execPath, ['out/consumer.mjs']);
    container = await new GenericContainer('postgres:16-alpine')
      .withEnvironment({
        POSTGRES_DB: 'forms_identity_host',
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'postgres',
      })
      .withExposedPorts(5432)
      .withWaitStrategy(
        Wait.forLogMessage('database system is ready to accept connections', 2),
      )
      .start();
    env.FORMS_IDENTITY_HOST_DATABASE_URL = `postgres://postgres:postgres@${container.getHost()}:${container.getMappedPort(5432)}/forms_identity_host`;
    await runAsync(process.execPath, ['run-consumer.mjs']);
    console.log(`Packed Forms/Identity ${configuration} passed.`);
  }
} finally {
  if (container) await container.stop();
  rmSync(host, { recursive: true, force: true });
}
