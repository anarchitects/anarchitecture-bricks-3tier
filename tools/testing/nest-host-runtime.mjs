import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { delimiter, dirname, isAbsolute, join } from 'node:path';

// Nx/Testcontainers stay on the tooling runtime. Installation, compilation and
// application execution use the selected consumer runtime, including npm's shebang.
export function nestHostRuntime(environment = process.env) {
  const node = environment.NEST_HOST_NODE || process.execPath;
  assert.ok(
    isAbsolute(node),
    'NEST_HOST_NODE must be an absolute Node executable path',
  );
  const env = { ...environment };
  delete env.NODE_PATH;
  delete env.NODE_OPTIONS;
  env.PATH = `${dirname(node)}${delimiter}${env.PATH ?? ''}`;
  const version = execFileSync(node, ['--version'], {
    env,
    encoding: 'utf8',
  }).trim();
  return { node, env, version };
}

export function nestHostCache(host, environment = process.env) {
  // A download cache never replaces fresh npm ci installs or integrity checks.
  return environment.NEST_HOST_NPM_CACHE || join(host, '.npm-cache');
}
