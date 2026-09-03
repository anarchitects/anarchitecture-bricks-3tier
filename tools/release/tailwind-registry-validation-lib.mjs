import assert from 'node:assert/strict';

export const TAILWIND_PACKAGE = '@anarchitects/tailwind';
export const TAILWIND_PROVENANCE_PREDICATE = 'https://slsa.dev/provenance/v1';
export const LEGACY_COMMON_ANGULAR_PACKAGES = [
  '@anarchitects/common-angular-design',
  '@anarchitects/common-angular-ui-composition',
  '@anarchitects/common-angular-ui-layouts',
  '@anarchitects/common-angular-ui-primitives',
];

export async function fetchRegistryPackument(packageName) {
  const registryName = packageName.replace('/', '%2f');
  const response = await fetch(`https://registry.npmjs.org/${registryName}`, {
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(
      `npm registry returned ${response.status} for ${packageName}`,
    );
  }

  return response.json();
}

export async function waitForPublishedVersion({
  packageName,
  version,
  loadPackument = fetchRegistryPackument,
  attempts = 12,
  delayMs = 5_000,
  validatePackument = () => undefined,
  sleep = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
}) {
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const packument = await loadPackument(packageName);
      if (packument.versions?.[version]) {
        validatePackument(packument);
        return packument;
      }
      lastError = new Error(
        `${packageName}@${version} is not visible in the npm registry yet`,
      );
    } catch (error) {
      lastError = error;
    }

    if (attempt < attempts) {
      await sleep(delayMs);
    }
  }

  throw lastError;
}

export function validateTailwindRegistryMetadata(packument, expectedVersion) {
  assert.equal(packument.name, TAILWIND_PACKAGE);
  const metadata = packument.versions?.[expectedVersion];
  assert.ok(
    metadata,
    `${TAILWIND_PACKAGE}@${expectedVersion} must be published`,
  );
  assert.equal(metadata.name, TAILWIND_PACKAGE);
  assert.equal(metadata.version, expectedVersion);
  assert.equal(metadata.style, './index.css');
  assert.deepEqual(metadata.exports, {
    '.': './index.css',
    './theme.css': './theme.css',
    './base.css': './base.css',
    './utilities.css': './utilities.css',
    './package.json': './package.json',
  });
  assert.equal(metadata.peerDependencies?.tailwindcss, '^4.0.0');
  assert.equal(metadata.publishConfig?.access, 'public');
  assert.equal(metadata.main, undefined);
  assert.equal(metadata.types, undefined);
  assert.match(
    metadata.dist?.tarball ?? '',
    /^https:\/\/registry\.npmjs\.org\//,
  );
  assert.match(metadata.dist?.integrity ?? '', /^sha512-/);
  assert.match(metadata.dist?.shasum ?? '', /^[a-f0-9]{40}$/);
  assert.ok(
    Array.isArray(metadata.dist?.signatures) &&
      metadata.dist.signatures.length > 0,
    'npm registry signature metadata must be present',
  );
  assert.equal(
    metadata.dist?.attestations?.provenance?.predicateType,
    TAILWIND_PROVENANCE_PREDICATE,
    'Trusted Publisher provenance must use the SLSA v1 predicate',
  );
  assert.match(
    metadata.dist?.attestations?.url ?? '',
    /\/npm\/v1\/attestations\//,
  );

  return metadata;
}

export function validateLegacyPackageRegistryMetadata(packageName, packument) {
  assert.equal(packument.name, packageName);
  const versions = Object.entries(packument.versions ?? {});
  assert.ok(versions.length > 0, `${packageName} must remain downloadable`);

  for (const [version, metadata] of versions) {
    assert.equal(
      metadata.deprecated,
      undefined,
      `${packageName}@${version} must remain non-deprecated during the Tailwind foundation wave`,
    );
  }

  return versions.map(([version]) => version);
}
