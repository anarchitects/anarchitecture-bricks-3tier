import { UserProfileResponseSchema as canonical } from '@anarchitects/identity-contracts';
import type { Static } from '@sinclair/typebox';
import { profileSchema } from './canonical-typebox.js';

export const UserProfileSchema = profileSchema(canonical);

export type UserProfileDTO = Static<typeof UserProfileSchema>;
