import { parsePolicyRuleArrayDTO } from '../dtos';
import { LoggedInUserInfoResponseDTO } from '../dtos/logged-in-user-info-response.dto';
import { AuthUser, PolicyRule } from '../models';
import { PolicyRuleWire, PublicUser } from './auth-public.types';
import { fromPolicyRuleWire, toPolicyRuleWire } from './policy-rule.mapper';
import { fromPublicAuthUser, toPublicAuthUser } from './auth-user.mapper';

export type LoggedInUserInfoModel = {
  user: AuthUser;
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
  user: toPublicAuthUser(model.user),
  rbac: model.rbac.map(toPolicyRuleWire),
});

export const fromLoggedInUserInfoResponseDTO = (
  dto: LoggedInUserInfoResponseDTO,
): LoggedInUserInfoModel => {
  const user = assertObject(dto.user, 'user');
  const rbac = parsePolicyRuleArrayDTO(dto.rbac, 'rbac');

  return {
    user: fromPublicAuthUser(user as PublicUser),
    rbac: rbac.map((rule) => fromPolicyRuleWire(rule as PolicyRuleWire)),
  };
};
