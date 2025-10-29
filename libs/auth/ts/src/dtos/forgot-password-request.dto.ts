import { Static, Type } from '@sinclair/typebox';

export const ForgotPasswordRequestSchema = Type.Object({
  email: Type.String({ format: 'email' }),
});

export type ForgotPasswordRequestDTO = Static<
  typeof ForgotPasswordRequestSchema
>;
