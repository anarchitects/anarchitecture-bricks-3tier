import { Static, Type } from '@sinclair/typebox';

const NullableStringSchema = Type.Union([Type.String(), Type.Null()]);

export const UserProfileSchema = Type.Object({
  id: Type.String(),
  authUserId: Type.String(),
  displayName: NullableStringSchema,
  givenName: NullableStringSchema,
  familyName: NullableStringSchema,
  avatarUrl: NullableStringSchema,
  locale: NullableStringSchema,
  timeZone: NullableStringSchema,
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
});

export type UserProfileDTO = Static<typeof UserProfileSchema>;
