import { Static, Type } from '@sinclair/typebox';

export const VerifyEmailRequestSchema = Type.Object({
  token: Type.String({ minLength: 1 }),
});

export type VerifyEmailRequestDTO = Static<typeof VerifyEmailRequestSchema>;
