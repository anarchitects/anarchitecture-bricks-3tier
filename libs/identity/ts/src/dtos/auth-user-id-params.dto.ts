import { Static, Type } from '@sinclair/typebox';

export const AuthUserIdParamsSchema = Type.Object({
  authUserId: Type.String({ minLength: 1, pattern: '^\\S+$' }),
});

export type AuthUserIdParamsDTO = Static<typeof AuthUserIdParamsSchema>;
