import { Static, Type } from '@sinclair/typebox';

export const LogoutRequestSchema = Type.Object({
  refreshToken: Type.Optional(Type.String({ minLength: 1 })),
  sessionId: Type.Optional(Type.String({ minLength: 1 })),
});

export type LogoutRequestDTO = Static<typeof LogoutRequestSchema>;
