import { Static } from '@sinclair/typebox';

import { defaultAuthContracts } from '../contracts/default-auth-contracts.js';

export const LogoutRequestSchema = defaultAuthContracts.logoutRequestSchema;

export type LogoutRequestDTO = Static<typeof LogoutRequestSchema>;
