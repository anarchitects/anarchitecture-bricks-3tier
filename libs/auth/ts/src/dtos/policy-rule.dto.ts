import type { z } from 'zod';
import {
  PolicyRuleSchema as canonicalRule,
  PolicyRuleArraySchema as canonicalRules,
} from '@anarchitects/auth-contracts/policy';
import { Value } from '@sinclair/typebox/value';
import {
  canonicalTypeBox,
  type CompatibilitySchema,
} from '../contracts/canonical-typebox.js';

export const PolicyRuleSchema = canonicalTypeBox(
  canonicalRule,
) as CompatibilitySchema<PolicyRuleDTO>;
export const PolicyRuleArraySchema = canonicalTypeBox(
  canonicalRules,
) as CompatibilitySchema<PolicyRuleArrayDTO>;

export type PolicyRuleDTO = Omit<
  z.output<typeof canonicalRule>,
  'conditions'
> & { conditions?: Record<string, unknown> };
export type PolicyRuleArrayDTO = PolicyRuleDTO[];

const formatValidationError = (value: unknown, fieldName: string): string => {
  const [firstError] = [...Value.Errors(PolicyRuleSchema, value)];
  if (!firstError) {
    return `Invalid ${fieldName}.`;
  }

  const path = firstError.path ? ` at ${firstError.path}` : '';
  return `Invalid ${fieldName}${path}: ${firstError.message}`;
};

export function assertPolicyRuleDTO(
  value: unknown,
  fieldName = 'policy rule',
): asserts value is PolicyRuleDTO {
  if (!Value.Check(PolicyRuleSchema, value)) {
    throw new Error(formatValidationError(value, fieldName));
  }
}

export const parsePolicyRuleDTO = (
  value: unknown,
  fieldName = 'policy rule',
): PolicyRuleDTO => {
  assertPolicyRuleDTO(value, fieldName);
  const rule = value as PolicyRuleDTO;

  return {
    action: rule.action,
    subject: rule.subject,
    conditions: rule.conditions ? { ...rule.conditions } : undefined,
    fields: rule.fields ? [...rule.fields] : undefined,
    inverted: rule.inverted,
    reason: rule.reason,
  };
};

export function assertPolicyRuleArrayDTO(
  value: unknown,
  fieldName = 'policy rules',
): asserts value is PolicyRuleArrayDTO {
  if (!Value.Check(PolicyRuleArraySchema, value)) {
    throw new Error(`Invalid ${fieldName}.`);
  }
}

export const parsePolicyRuleArrayDTO = (
  value: unknown,
  fieldName = 'policy rules',
): PolicyRuleArrayDTO => {
  assertPolicyRuleArrayDTO(value, fieldName);
  const rules = value as PolicyRuleArrayDTO;

  return rules.map((rule, index) =>
    parsePolicyRuleDTO(rule, `${fieldName}[${index}]`),
  );
};
