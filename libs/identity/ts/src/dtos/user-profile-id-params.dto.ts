import { Static, Type } from '@sinclair/typebox';

export const UserProfileIdParamsSchema = Type.Object({
  profileId: Type.String({ minLength: 1, pattern: '^\\S+$' }),
});

export type UserProfileIdParamsDTO = Static<typeof UserProfileIdParamsSchema>;
