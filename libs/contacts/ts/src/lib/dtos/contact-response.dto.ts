import { Static, Type } from '@sinclair/typebox';

export const ContactResponseSchema = Type.Object({
  success: Type.Boolean(),
});

export type ContactResponseDto = Static<typeof ContactResponseSchema>;
