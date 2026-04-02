import { DefaultAuthContractConfig } from './auth-contract.config';
import {
  type AuthContracts,
  createAuthContracts,
} from './auth-contracts.factory';

export const defaultAuthContracts: AuthContracts<
  typeof DefaultAuthContractConfig
> = createAuthContracts(DefaultAuthContractConfig);
