import { Static } from '@sinclair/typebox';

import { defaultAuthContracts } from '../contracts/default-auth-contracts';

export const LogoutRequestSchema = defaultAuthContracts.logoutRequestSchema;

export type LogoutRequestDTO = Static<typeof LogoutRequestSchema>;
