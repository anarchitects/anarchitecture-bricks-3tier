import { Static } from '@sinclair/typebox';

import { defaultAuthContracts } from '../contracts/default-auth-contracts';

export const ChangePasswordRequestSchema =
  defaultAuthContracts.changePasswordRequestSchema;

export type ChangePasswordRequestDTO = Static<
  typeof ChangePasswordRequestSchema
>;
