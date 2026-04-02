import { Static } from '@sinclair/typebox';

import { defaultAuthContracts } from '../contracts/default-auth-contracts';

export const ForgotPasswordRequestSchema =
  defaultAuthContracts.forgotPasswordRequestSchema;

export type ForgotPasswordRequestDTO = Static<
  typeof ForgotPasswordRequestSchema
>;
