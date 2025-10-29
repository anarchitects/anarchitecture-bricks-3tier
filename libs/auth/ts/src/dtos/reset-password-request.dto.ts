import { Static, Type } from '@sinclair/typebox';

export const ResetPasswordRequestSchema = Type.Object({
  token: Type.String({ minLength: 1 }),
  password: Type.String({ minLength: 6 }),
  confirmPassword: Type.String({ minLength: 6 }),
});

export type ResetPasswordRequestDTO = Static<typeof ResetPasswordRequestSchema>;
