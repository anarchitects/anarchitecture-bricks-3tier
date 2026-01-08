import { Static, Type } from '@sinclair/typebox';

export const LogoutRequestSchema = Type.Object({
  refreshToken: Type.String({ minLength: 1 }),
  accessToken: Type.Optional(Type.String({ minLength: 1 })),
});

export type LogoutRequestDTO = Static<typeof LogoutRequestSchema>;
