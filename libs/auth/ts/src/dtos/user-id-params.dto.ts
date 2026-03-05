import { Static, Type } from '@sinclair/typebox';

export const UserIdParamsSchema = Type.Object({
  userId: Type.String(),
});

export type UserIdParamsDTO = Static<typeof UserIdParamsSchema>;
