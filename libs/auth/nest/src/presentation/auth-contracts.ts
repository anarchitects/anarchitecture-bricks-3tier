import {
  type AuthContractConfig,
  type AuthContracts,
  DefaultAuthContractConfig,
  createAuthContracts,
} from '@anarchitects/auth-ts';
import type { Provider } from '@nestjs/common';

export const AUTH_CONTRACTS = Symbol('AUTH_CONTRACTS');

export type DefaultAuthContracts = AuthContracts<
  typeof DefaultAuthContractConfig
>;
export type ResolvedAuthContracts = AuthContracts<AuthContractConfig>;

export const createDefaultAuthContracts = (): DefaultAuthContracts =>
  createAuthContracts(DefaultAuthContractConfig);

export const createAuthContractsFromConfig = <C extends AuthContractConfig>(
  config: C,
): AuthContracts<C> => createAuthContracts(config);

export const createAuthContractsProvider = (
  contracts: ResolvedAuthContracts,
): Provider => ({
  provide: AUTH_CONTRACTS,
  useValue: contracts,
});
