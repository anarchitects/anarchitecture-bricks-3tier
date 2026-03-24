import { PolicyRule } from './auth.types';

export type RoutePolicy = Pick<PolicyRule, 'action' | 'subject'>;

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
  const matchingRules = policyRules.filter((policyRule) =>
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
