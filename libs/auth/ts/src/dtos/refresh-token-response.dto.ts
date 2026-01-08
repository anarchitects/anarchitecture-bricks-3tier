import { Static, Type } from '@sinclair/typebox';

export const RefreshTokenResponseSchema = Type.Object({
  accessToken: Type.String({ minLength: 1 }),
  refreshToken: Type.String({ minLength: 1 }),
});

export type RefreshTokenResponseDTO = Static<typeof RefreshTokenResponseSchema>;
