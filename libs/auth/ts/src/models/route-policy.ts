import { parsePolicyRuleDTO } from '../dtos';
import { PolicyRule } from './auth.types';

export type RoutePolicy = Pick<PolicyRule, 'action' | 'subject'>;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const isRoutePolicy = (value: unknown): value is RoutePolicy =>
  !!value &&
  typeof value === 'object' &&
  isNonEmptyString((value as RoutePolicy).action) &&
  isNonEmptyString((value as RoutePolicy).subject);

const parseRoutePolicyRules = (value: unknown): PolicyRule[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  try {
    return value.map((policyRule, index) =>
      parsePolicyRuleDTO(policyRule, `policyRules[${index}]`),
    );
  } catch {
    return null;
  }
};

const matchesRoutePolicy = (
  routePolicy: RoutePolicy,
  policyRule: PolicyRule,
): boolean =>
  (policyRule.action === routePolicy.action ||
    policyRule.action === 'manage') &&
  (policyRule.subject === routePolicy.subject || policyRule.subject === 'all');

const isScopedRule = (policyRule: PolicyRule): boolean =>
  Boolean(policyRule.conditions || policyRule.fields?.length);

export const canAttemptRoutePolicy = (
  routePolicy: RoutePolicy,
  policyRules: PolicyRule[],
): boolean => {
  if (!isRoutePolicy(routePolicy)) {
    return false;
  }

  const parsedPolicyRules = parseRoutePolicyRules(policyRules);
  if (!parsedPolicyRules) {
    return false;
  }

  const matchingRules = parsedPolicyRules.filter((policyRule) =>
    matchesRoutePolicy(routePolicy, policyRule),
  );

  if (!matchingRules.length) {
    return false;
  }

  if (
    matchingRules.some(
      (policyRule) => policyRule.inverted && !isScopedRule(policyRule),
    )
  ) {
    return false;
  }

  return matchingRules.some((policyRule) => !policyRule.inverted);
};
