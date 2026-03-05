import { LoggedInUserInfoResponseDTO } from '../dtos/logged-in-user-info-response.dto';
import { PolicyRule, User } from '../models';
import { PolicyRuleWire, PublicUser } from './auth-public.types';
import { fromPolicyRuleWire, toPolicyRuleWire } from './policy-rule.mapper';
import { fromPublicUser, toPublicUser } from './user.mapper';

export type LoggedInUserInfoModel = {
  user: User;
  rbac: PolicyRule[];
};

export type PublicLoggedInUserInfo = {
  user: PublicUser;
  rbac: PolicyRuleWire[];
};

const assertObject = (
  value: unknown,
  fieldName: string,
): Record<string, unknown> => {
  if (!value || typeof value !== 'object') {
    throw new Error(`Expected "${fieldName}" to be an object.`);
  }
  return value as Record<string, unknown>;
};

export const toLoggedInUserInfoResponseDTO = (
  model: LoggedInUserInfoModel,
): LoggedInUserInfoResponseDTO => ({
  user: toPublicUser(model.user),
  rbac: model.rbac.map(toPolicyRuleWire),
});

export const fromLoggedInUserInfoResponseDTO = (
  dto: LoggedInUserInfoResponseDTO,
  options: { passwordHash: string; token?: string | null },
): LoggedInUserInfoModel => {
  const user = assertObject(dto.user, 'user');
  const rbac = Array.isArray(dto.rbac) ? dto.rbac : [];

  return {
    user: fromPublicUser(user as PublicUser, options),
    rbac: rbac.map((rule) =>
      fromPolicyRuleWire(assertObject(rule, 'rbac rule') as PolicyRuleWire),
    ),
  };
};
