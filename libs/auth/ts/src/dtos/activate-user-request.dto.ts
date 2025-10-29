import { Static, Type } from '@sinclair/typebox';

export const ActivateUserRequestSchema = Type.Object({
  token: Type.String({ minLength: 1 }),
});

export type ActivateUserRequestDTO = Static<typeof ActivateUserRequestSchema>;
