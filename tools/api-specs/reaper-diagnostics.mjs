import { execFile } from 'node:child_process';
import { getDefaultResultOrder, lookup } from 'node:dns/promises';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const docker = async (...args) =>
  (
    await exec('docker', args, { timeout: 5000, maxBuffer: 128 * 1024 })
  ).stdout.trim();

// Inspect only Ryuk, never application container environments or Docker auth.
// These observations must not replace the original host/startup error.
export async function reaperDiagnostics(phase, includeLogs = false) {
  const emit = (data) =>
    console.log(
      JSON.stringify({
        check: 'testcontainers-diagnostics',
        time: new Date().toISOString(),
        phase,
        ...data,
      }),
    );
  try {
    emit({
      node: process.version,
      platform: process.platform,
      dnsOrder: getDefaultResultOrder(),
      localhost: await lookup('localhost', { all: true }),
      hostOverride: process.env.TESTCONTAINERS_HOST_OVERRIDE ?? null,
    });
  } catch (error) {
    emit({ diagnostic: 'dns', error: error.code ?? error.message });
  }
  try {
    const ids = (
      await docker(
        'ps',
        '-aq',
        '--filter',
        'label=org.testcontainers.ryuk=true',
      )
    )
      .split(/\s+/)
      .filter(Boolean);
    emit({ dockerCliReapers: ids });
    for (const id of ids) {
      try {
        // Use an explicit projection: docker inspect's Config.Env is excluded.
        const state = JSON.parse(
          await docker(
            'inspect',
            '--format',
            '{"id":{{json .Id}},"status":{{json .State.Status}},"running":{{json .State.Running}},"oomKilled":{{json .State.OOMKilled}},"exitCode":{{json .State.ExitCode}},"startedAt":{{json .State.StartedAt}},"finishedAt":{{json .State.FinishedAt}},"ports":{{json .NetworkSettings.Ports}}}',
            id,
          ),
        );
        emit({ reaper: state });
        if (includeLogs) {
          // Docker sends container stderr to the CLI's stderr even on success.
          const logs = await exec(
            'docker',
            ['logs', '--timestamps', '--tail', '80', id],
            { timeout: 5000, maxBuffer: 128 * 1024 },
          );
          emit({ reaperId: id, logs: `${logs.stdout}${logs.stderr}` });
        }
      } catch (error) {
        emit({ reaperId: id, error: error.code ?? error.message });
      }
    }
  } catch (error) {
    emit({ diagnostic: 'docker-cli', error: error.code ?? error.message });
  }
}
