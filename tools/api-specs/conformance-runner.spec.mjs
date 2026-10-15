import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runConformanceHosts } from './run-conformance-hosts.mjs';

for (const suite of ['nest11', 'nest12']) {
  test(`${suite}: all HTTP hosts share a live parent Reaper session across child exits`, async () => {
    let connected = false;
    const events = [];
    await runConformanceHosts(suite, {
      diagnostics: async () => undefined,
      startSession: async () => {
        connected = true;
        events.push('connect');
        return {
          stop: async () => {
            connected = false;
            events.push('stop');
          },
        };
      },
      runHost: async ({ family, configuration }) => {
        assert.equal(configuration, suite);
        assert.ok(connected);
        events.push(family);
        // Simulate an asynchronous gap after a child exits. The parent must
        // retain its session while the next child's setup is running.
        await new Promise((resolve) => setImmediate(resolve));
        assert.ok(connected);
      },
    });
    assert.deepEqual(events, [
      'connect',
      'auth',
      'forms-identity',
      'newsletter',
      'stop',
    ]);
    assert.equal(connected, false);
  });
}

test('a Forms host failure stops the sequence, releases the session and retains the original error', async () => {
  const events = [];
  const failure = new Error('Failed to connect to Reaper');
  await assert.rejects(
    runConformanceHosts('nest11', {
      startSession: async () => ({ stop: async () => events.push('stop') }),
      diagnostics: async (phase, logs) => {
        if (logs) events.push(phase);
      },
      runHost: async ({ family }) => {
        events.push(family);
        if (family === 'forms-identity') throw failure;
      },
    }),
    (error) => error === failure,
  );
  assert.deepEqual(events, ['auth', 'forms-identity', 'stop', 'failed']);
});

test('parent startup failure remains fatal and requests diagnostics without running hosts', async () => {
  const failure = new Error('Docker unavailable');
  const events = [];
  await assert.rejects(
    runConformanceHosts('nest11', {
      startSession: async () => {
        throw failure;
      },
      diagnostics: async (phase) => events.push(phase),
      runHost: async () =>
        assert.fail('No host may run without the parent session'),
    }),
    (error) => error === failure,
  );
  assert.deepEqual(events, ['before-session', 'failed']);
});

test('invalid configurations fail before Docker or host execution', async () => {
  await assert.rejects(
    runConformanceHosts('nest13', {
      diagnostics: async () =>
        assert.fail('No Docker probes for invalid arguments'),
    }),
    /Expected one suite/,
  );
});

test('the HTTP gate rejects disabled Ryuk before starting any hosts', async (t) => {
  const original = process.env.TESTCONTAINERS_RYUK_DISABLED;
  t.after(() => {
    if (original === undefined) delete process.env.TESTCONTAINERS_RYUK_DISABLED;
    else process.env.TESTCONTAINERS_RYUK_DISABLED = original;
  });
  process.env.TESTCONTAINERS_RYUK_DISABLED = 'true';
  await assert.rejects(
    runConformanceHosts('nest11', {
      diagnostics: async () =>
        assert.fail('No Docker probes with disabled Ryuk'),
    }),
    /requires Ryuk/,
  );
});

test('Nx runs one parent for both uncached HTTP suites and retains packed artifact prerequisites', () => {
  const project = JSON.parse(
    readFileSync(new URL('./project.json', import.meta.url), 'utf8'),
  );
  const target = project.targets['conformance-http'];
  assert.equal(target.cache, false);
  assert.equal(target.parallelism, false);
  assert.equal(
    target.options.command,
    'node tools/api-specs/run-conformance-hosts.mjs nest11',
  );
  assert.equal(
    target.configurations.nest12.command,
    'node tools/api-specs/run-conformance-hosts.mjs nest12',
  );
  assert.equal(target.options.commands, undefined);
  assert.equal(target.options.env.DEBUG, 'testcontainers');
  assert.deepEqual(target.dependsOn, [
    {
      projects: ['release-tools'],
      target: 'validate-nest-package-compatibility',
    },
  ]);
});
