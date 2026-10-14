import { UpdateUserProfileRequestSchema as canonical } from '@anarchitects/identity-contracts';
import type { Static } from '@sinclair/typebox';
import { profileRequest } from './canonical-typebox.js';

export const UpdateUserProfileRequestSchema = profileRequest(canonical);

export type UpdateUserProfileRequestDTO = Static<
  typeof UpdateUserProfileRequestSchema
>;
