import { Static, Type } from '@sinclair/typebox';

export const SuccessResponseSchema = Type.Object({
  success: Type.Boolean(),
});

export type SuccessResponseDTO = Static<typeof SuccessResponseSchema>;
