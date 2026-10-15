import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runHostCasesWithReaper } from '../testing/nest-compatibility-matrix.mjs';
import { reaperDiagnostics } from './reaper-diagnostics.mjs';

const root = resolve(import.meta.dirname, '../..');
function runPackedHost({ family, configuration }) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [`tools/testing/run-${family}-nest-host.mjs`, configuration],
      {
        cwd: root,
        stdio: 'inherit',
        env: process.env,
      },
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

export async function runConformanceHosts(
  configuration,
  {
    runHost = runPackedHost,
    startSession,
    diagnostics = reaperDiagnostics,
  } = {},
) {
  assert.ok(
    ['nest11', 'nest12'].includes(configuration),
    'Expected one suite: nest11 or nest12',
  );
  assert.notEqual(
    process.env.TESTCONTAINERS_RYUK_DISABLED,
    'true',
    'HTTP conformance requires Ryuk cleanup',
  );
  const cases = ['auth', 'forms-identity', 'newsletter'].map((family) => ({
    family,
    configuration,
  }));
  // The matrix already guards the interval between short-lived host processes.
  // Reuse that lifecycle here; each host still owns its independent database.
  await diagnostics('before-session');
  try {
    await runHostCasesWithReaper(
      cases,
      async (host) => {
        const name = `${host.family}/${host.configuration}`;
        await diagnostics(`before-${name}`);
        await runHost(host);
        await diagnostics(`after-${name}`);
      },
      startSession,
    );
  } catch (error) {
    await diagnostics('failed', true);
    throw error;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  assert.equal(process.argv.length, 3, 'Expected one suite: nest11 or nest12');
  await runConformanceHosts(process.argv[2]);
}
