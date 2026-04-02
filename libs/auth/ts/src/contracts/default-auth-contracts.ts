import { DefaultAuthContractConfig } from './auth-contract.config';
import { createAuthContracts } from './auth-contracts.factory';

export const defaultAuthContracts = createAuthContracts(
  DefaultAuthContractConfig,
);
