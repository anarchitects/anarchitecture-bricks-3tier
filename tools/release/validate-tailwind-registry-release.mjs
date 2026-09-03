import {
  LEGACY_COMMON_ANGULAR_PACKAGES,
  TAILWIND_PACKAGE,
  fetchRegistryPackument,
  validateLegacyPackageRegistryMetadata,
  validateTailwindRegistryMetadata,
  waitForPublishedVersion,
} from './tailwind-registry-validation-lib.mjs';

const expectedVersion = process.env.ANARCHITECTS_TAILWIND_VERSION?.trim();
if (
  !expectedVersion ||
  !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(expectedVersion)
) {
  throw new Error(
    'ANARCHITECTS_TAILWIND_VERSION must contain the published semver version',
  );
}

const tailwindPackument = await waitForPublishedVersion({
  packageName: TAILWIND_PACKAGE,
  version: expectedVersion,
  validatePackument: (packument) =>
    validateTailwindRegistryMetadata(packument, expectedVersion),
});
validateTailwindRegistryMetadata(tailwindPackument, expectedVersion);

for (const packageName of LEGACY_COMMON_ANGULAR_PACKAGES) {
  const packument = await fetchRegistryPackument(packageName);
  const versions = validateLegacyPackageRegistryMetadata(
    packageName,
    packument,
  );
  console.log(
    `${packageName}: ${versions.length} published version(s), none deprecated`,
  );
}

console.log(
  `${TAILWIND_PACKAGE}@${expectedVersion}: exports, peer metadata, integrity, registry signature, and Trusted Publisher provenance are valid`,
);
