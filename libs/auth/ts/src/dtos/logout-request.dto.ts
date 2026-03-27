import { Static, Type } from '@sinclair/typebox';

export const LogoutRequestSchema = Type.Object({}, { additionalProperties: false });

export type LogoutRequestDTO = Static<typeof LogoutRequestSchema>;
