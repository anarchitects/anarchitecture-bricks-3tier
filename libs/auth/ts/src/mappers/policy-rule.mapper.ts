import { parsePolicyRuleDTO } from '../dtos/index.js';
import { PolicyRule } from '../models/auth.types.js';
import { PolicyRuleWire } from './auth-public.types.js';

export const toPolicyRuleWire = (rule: PolicyRule): PolicyRuleWire => ({
  ...parsePolicyRuleDTO({
    action: rule.action,
    subject: rule.subject,
    conditions: rule.conditions ? { ...rule.conditions } : undefined,
    fields: rule.fields ? [...rule.fields] : undefined,
    inverted: rule.inverted,
    reason: rule.reason,
  }),
});

export const fromPolicyRuleWire = (wire: PolicyRuleWire): PolicyRule => ({
  ...parsePolicyRuleDTO(wire),
});
