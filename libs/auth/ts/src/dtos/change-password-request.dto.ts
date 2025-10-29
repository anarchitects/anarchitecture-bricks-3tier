import { Static, Type } from '@sinclair/typebox';

export const ChangePasswordRequestSchema = Type.Object({
  currentPassword: Type.String({ minLength: 6 }),
  newPassword: Type.String({ minLength: 6 }),
  confirmPassword: Type.String({ minLength: 6 }),
});

export type ChangePasswordRequestDTO = Static<
  typeof ChangePasswordRequestSchema
>;
