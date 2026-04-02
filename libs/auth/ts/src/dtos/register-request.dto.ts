import { Static } from '@sinclair/typebox';

import { defaultAuthContracts } from '../contracts/default-auth-contracts';

export const RegisterRequestSchema = defaultAuthContracts.registerRequestSchema;

export type RegisterRequestDTO = Static<typeof RegisterRequestSchema>;
