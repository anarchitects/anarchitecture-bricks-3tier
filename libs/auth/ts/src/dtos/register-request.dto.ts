import { Static, Type } from '@sinclair/typebox';

export const RegisterRequestSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 6 }),
  confirmPassword: Type.String({ minLength: 6 }),
  name: Type.Optional(Type.String({ minLength: 2, maxLength: 100 })),
});

export type RegisterRequestDTO = Static<typeof RegisterRequestSchema>;
