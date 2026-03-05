import { PolicyRule } from '../models/auth.types';
import { PolicyRuleWire } from './auth-public.types';

export const toPolicyRuleWire = (rule: PolicyRule): PolicyRuleWire => ({
  action: rule.action,
  subject: rule.subject,
  conditions: rule.conditions ? { ...rule.conditions } : undefined,
  fields: rule.fields ? [...rule.fields] : undefined,
  inverted: rule.inverted,
  reason: rule.reason,
});

export const fromPolicyRuleWire = (wire: PolicyRuleWire): PolicyRule => ({
  action: wire.action,
  subject: wire.subject,
  conditions: wire.conditions ? { ...wire.conditions } : undefined,
  fields: wire.fields ? [...wire.fields] : undefined,
  inverted: wire.inverted,
  reason: wire.reason,
});
