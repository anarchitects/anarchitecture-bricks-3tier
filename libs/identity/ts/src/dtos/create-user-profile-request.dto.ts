import { CreateUserProfileRequestSchema as canonical } from '@anarchitects/identity-contracts';
import type { Static } from '@sinclair/typebox';
import { profileRequest } from './canonical-typebox.js';

export const CreateUserProfileRequestSchema = profileRequest(canonical);

export type CreateUserProfileRequestDTO = Static<
  typeof CreateUserProfileRequestSchema
>;
