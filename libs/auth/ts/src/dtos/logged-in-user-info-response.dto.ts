import { Static, Type } from '@sinclair/typebox';

export const LoggedInUserInfoResponseSchema = Type.Object({
  user: Type.Unknown(),
  rbac: Type.Array(Type.Unknown()),
});

export type LoggedInUserInfoResponseDTO = Static<
  typeof LoggedInUserInfoResponseSchema
>;
