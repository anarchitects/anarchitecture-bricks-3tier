import assert from 'node:assert/strict';
import semver from 'semver';
import { Network } from 'testcontainers';

export async function runHostCasesWithReaper(
  cases,
  runHost,
  startSession = () => new Network().start(),
) {
  // Starting a Testcontainers resource connects this long-lived parent to Ryuk.
  // Keep that connection across child exits and npm/compiler work: otherwise
  // the next child can discover a running Reaper that has begun shutting down.
  // The network is only a session anchor; hosts retain separate databases and
  // their own container cleanup. Ryuk also remains enabled for abnormal exits.
  const session = await startSession();
  try {
    for (const host of cases) await runHost(host);
  } finally {
    await session.stop();
  }
}

export const ciLanes = [
  { node: '20.19.0', suite: 'nest11', postgres: '16' },
  { node: '22.13.0', suite: 'nest11', postgres: '16' },
  { node: '22.13.0', suite: 'nest12', postgres: '16' },
  { node: '24.11.0', suite: 'nest11', postgres: '16' },
  { node: '24.11.0', suite: 'nest12', postgres: '16' },
  { node: '26.11.1', suite: 'nest11', postgres: '16' },
  { node: '26.11.1', suite: 'nest12', postgres: '16' },
  { node: '24.11.0', suite: 'nest11', postgres: '17' },
  { node: '24.11.0', suite: 'nest12', postgres: '17' },
  { node: '24.11.0', suite: 'nest11', postgres: '18' },
  { node: '24.11.0', suite: 'nest12', postgres: '18' },
];

export function hostCases(suite, nodeVersion) {
  assert.ok(
    ['nest11', 'nest12'].includes(suite),
    'Expected suite nest11 or nest12',
  );
  assert.ok(
    semver.satisfies(nodeVersion, '^20.19.0 || ^22.13.0 || >=24.11.0'),
    'Unsupported consumer Node version',
  );
  const node20 = semver.major(nodeVersion) === 20;
  assert.ok(
    !(node20 && suite === 'nest12'),
    'Nest 12 locked file-type requires Node >=22',
  );
  const cases = [];
  for (const family of [
    'common-mailer',
    'auth',
    'forms-identity',
    'newsletter',
  ]) {
    if (node20 && family === 'auth') continue;
    const configurations =
      suite === 'nest12'
        ? ['nest12']
        : [
            'nest11',
            family === 'common-mailer' ? 'nest11-config12' : 'nest11-modern',
          ];
    if (family === 'newsletter') configurations.push(`${suite}-optional`);
    for (const configuration of configurations)
      cases.push({ family, configuration });
  }
  return {
    cases,
    exclusions: node20
      ? [
          'Auth/declarations combined host: locked Kysely requires Node >=22; no standalone declarations Node 20 certification.',
        ]
      : [],
  };
}

export function fixtureDirectory(family, configuration) {
  return family === 'common-mailer'
    ? `libs/common/nest/mailer/tests/hosts/${configuration}`
    : `tools/testing/${family}-nest-hosts/${configuration}`;
}
