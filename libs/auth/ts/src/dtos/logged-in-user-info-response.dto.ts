import { Static, Type } from '@sinclair/typebox';
import { PolicyRuleArraySchema } from './policy-rule.dto.js';

export const LoggedInUserInfoResponseSchema = Type.Object({
  user: Type.Unknown(),
  rbac: PolicyRuleArraySchema,
});

export type LoggedInUserInfoResponseDTO = Static<
  typeof LoggedInUserInfoResponseSchema
>;
