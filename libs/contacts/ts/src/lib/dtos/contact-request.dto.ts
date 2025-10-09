import { Static, Type } from '@sinclair/typebox';

export const ContactRequestSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  email: Type.String({ format: 'email' }),
  message: Type.String({ minLength: 1, maxLength: 1000 }),
});

export type ContactRequestDto = Static<typeof ContactRequestSchema>;
