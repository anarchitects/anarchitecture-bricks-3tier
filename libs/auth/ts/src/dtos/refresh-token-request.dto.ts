import { Static, Type } from '@sinclair/typebox';

export const RefreshTokenRequestSchema = Type.Object({
  refreshToken: Type.String({ minLength: 1 }),
});

export type RefreshTokenRequestDTO = Static<typeof RefreshTokenRequestSchema>;
