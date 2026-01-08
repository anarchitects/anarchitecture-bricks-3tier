import { Static, Type } from '@sinclair/typebox';

export const LoginResponseSchema = Type.Object({
  accessToken: Type.String({ minLength: 1 }),
  refreshToken: Type.String({ minLength: 1 }),
});

export type LoginResponseDTO = Static<typeof LoginResponseSchema>;
