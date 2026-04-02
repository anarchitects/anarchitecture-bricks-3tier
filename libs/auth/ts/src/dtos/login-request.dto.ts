import { Static } from '@sinclair/typebox';

import { defaultAuthContracts } from '../contracts/default-auth-contracts';

export const LoginRequestSchema = defaultAuthContracts.loginRequestSchema;

export type LoginRequestDTO = Static<typeof LoginRequestSchema>;
