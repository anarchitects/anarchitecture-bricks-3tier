import { AuthUserIdParamsSchema as canonical } from '@anarchitects/identity-contracts';
import type { Static } from '@sinclair/typebox';
import { profileSchema } from './canonical-typebox.js';

export const AuthUserIdParamsSchema = profileSchema(canonical);

export type AuthUserIdParamsDTO = Static<typeof AuthUserIdParamsSchema>;
