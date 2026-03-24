import { Static, Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

export const PolicyRuleSchema = Type.Object(
  {
    action: Type.String({ minLength: 1 }),
    subject: Type.String({ minLength: 1 }),
    conditions: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
    fields: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
    inverted: Type.Optional(Type.Boolean()),
    reason: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
);

export const PolicyRuleArraySchema = Type.Array(PolicyRuleSchema);

export type PolicyRuleDTO = Static<typeof PolicyRuleSchema>;
export type PolicyRuleArrayDTO = Static<typeof PolicyRuleArraySchema>;

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
