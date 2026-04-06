import {
  type AuthContracts,
  DefaultAuthContractConfig,
  createAuthContracts,
} from '@anarchitects/auth-ts';
import type { Provider } from '@nestjs/common';

export const AUTH_CONTRACTS = Symbol('AUTH_CONTRACTS');

export type DefaultAuthContracts = AuthContracts<
  typeof DefaultAuthContractConfig
>;

export const createDefaultAuthContracts = (): DefaultAuthContracts =>
  createAuthContracts(DefaultAuthContractConfig);

export const createAuthContractsProvider = (
  contracts: DefaultAuthContracts,
): Provider => ({
  provide: AUTH_CONTRACTS,
  useValue: contracts,
});
