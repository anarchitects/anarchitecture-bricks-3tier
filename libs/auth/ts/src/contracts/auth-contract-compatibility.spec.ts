import { describe, expect, it } from 'vitest';

import { assertContractCompatibility } from './auth-contract-compatibility';
import {
  type AuthContractConfig,
  DefaultAuthContractConfig,
} from './auth-contract.config';

describe('assertContractCompatibility', () => {
  it('does not throw when versions match', () => {
    expect(() => {
      assertContractCompatibility(DefaultAuthContractConfig, '1.0.0');
    }).not.toThrow();
  });

  it('supports numeric contract versions by comparing string values', () => {
    const numericVersionConfig: AuthContractConfig = {
      ...DefaultAuthContractConfig,
      version: 1,
    };

    expect(() => {
      assertContractCompatibility(numericVersionConfig, '1');
    }).not.toThrow();
  });

  it('throws a descriptive error when versions differ', () => {
    expect(() => {
      assertContractCompatibility(DefaultAuthContractConfig, '2.0.0');
    }).toThrow(
      'Auth contract profile version mismatch: expected "2.0.0" but received "1.0.0". Update the expected version or migrate to a compatible contract profile.',
    );
  });
});
