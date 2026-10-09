import { Static } from '@sinclair/typebox';

import { defaultAuthContracts } from '../contracts/default-auth-contracts.js';

export const VerifyEmailRequestSchema =
  defaultAuthContracts.verifyEmailRequestSchema;

export type VerifyEmailRequestDTO = Static<typeof VerifyEmailRequestSchema>;
