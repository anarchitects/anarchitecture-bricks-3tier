import { parsePolicyRuleDTO } from '@anarchitects/auth-ts/dtos';
import { Permission, PolicyRule } from '@anarchitects/auth-ts/models';

const cloneConditions = (
  conditions: Record<string, unknown> | null | undefined,
): Record<string, unknown> | undefined => {
  if (!conditions) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(conditions)) as Record<string, unknown>;
};

export const toValidatedPersistedPolicyRule = (
  permission: Pick<
    Permission,
    'action' | 'subject' | 'conditions' | 'fields' | 'inverted' | 'reason'
  >,
): PolicyRule =>
  parsePolicyRuleDTO({
    action: permission.action,
    subject: permission.subject,
    conditions: cloneConditions(permission.conditions),
    fields: permission.fields ?? undefined,
    inverted: permission.inverted ?? false,
    reason: permission.reason ?? undefined,
  });
