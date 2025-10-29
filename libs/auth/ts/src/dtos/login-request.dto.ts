import { Static, Type } from '@sinclair/typebox';

export const LoginRequestSchema = Type.Object({
  credential: Type.String({ minLength: 2, maxLength: 100 }),
  password: Type.String({ minLength: 6 }),
});

export type LoginRequestDTO = Static<typeof LoginRequestSchema>;
