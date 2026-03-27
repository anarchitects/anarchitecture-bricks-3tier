import { Static, Type } from '@sinclair/typebox';

export const JwtLogoutRequestSchema = Type.Object({
  refreshToken: Type.String({ minLength: 1 }),
  accessToken: Type.Optional(Type.String({ minLength: 1 })),
});

export type JwtLogoutRequestDTO = Static<typeof JwtLogoutRequestSchema>;
