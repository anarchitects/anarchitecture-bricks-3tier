import { Static, Type } from '@sinclair/typebox';

export const RegisterResponseSchema = Type.Object({
  success: Type.Boolean(),
});

export type RegisterResponseDTO = Static<typeof RegisterResponseSchema>;
