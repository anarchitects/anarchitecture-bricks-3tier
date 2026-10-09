import { Static } from '@sinclair/typebox';

import { defaultAuthContracts } from '../contracts/default-auth-contracts.js';

export const ResetPasswordRequestSchema =
  defaultAuthContracts.resetPasswordRequestSchema;

export type ResetPasswordRequestDTO = Static<typeof ResetPasswordRequestSchema>;
