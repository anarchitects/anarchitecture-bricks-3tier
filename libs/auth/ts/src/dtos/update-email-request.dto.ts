import { Static, Type } from '@sinclair/typebox';

export const UpdateEmailRequestSchema = Type.Object({
  newEmail: Type.String({ format: 'email' }),
  password: Type.Optional(Type.String({ minLength: 6 })),
});

export type UpdateEmailRequestDTO = Static<typeof UpdateEmailRequestSchema>;
