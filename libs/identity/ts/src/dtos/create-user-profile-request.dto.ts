import { Static, Type } from '@sinclair/typebox';

const NullableStringSchema = Type.Union([Type.String(), Type.Null()]);

export const CreateUserProfileRequestSchema = Type.Object({
  authUserId: Type.String(),
  displayName: Type.Optional(NullableStringSchema),
  givenName: Type.Optional(NullableStringSchema),
  familyName: Type.Optional(NullableStringSchema),
  avatarUrl: Type.Optional(NullableStringSchema),
  locale: Type.Optional(NullableStringSchema),
  timeZone: Type.Optional(NullableStringSchema),
});

export type CreateUserProfileRequestDTO = Static<
  typeof CreateUserProfileRequestSchema
>;
