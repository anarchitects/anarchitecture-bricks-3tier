import { DefaultAuthContractConfig } from './auth-contract.config.js';
import {
  type AuthContracts,
  createAuthContracts,
} from './auth-contracts.factory.js';

export const defaultAuthContracts: AuthContracts<
  typeof DefaultAuthContractConfig
> = createAuthContracts(DefaultAuthContractConfig);
