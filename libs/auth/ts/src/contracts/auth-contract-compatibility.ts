import type { AuthContractConfig } from './auth-contract.config';

export function assertContractCompatibility(
  config: AuthContractConfig,
  expectedVersion: string,
): void {
  const actualVersion = String(config.version);

  if (actualVersion !== expectedVersion) {
    throw new Error(
      `Auth contract profile version mismatch: expected "${expectedVersion}" but received "${actualVersion}". Update the expected version or migrate to a compatible contract profile.`,
    );
  }
}
