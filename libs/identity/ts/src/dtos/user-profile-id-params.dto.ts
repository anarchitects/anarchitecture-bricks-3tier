import { UserProfileIdParamsSchema as canonical } from '@anarchitects/identity-contracts';
import type { Static } from '@sinclair/typebox';
import { profileSchema } from './canonical-typebox.js';

export const UserProfileIdParamsSchema = profileSchema(canonical);

export type UserProfileIdParamsDTO = Static<typeof UserProfileIdParamsSchema>;
