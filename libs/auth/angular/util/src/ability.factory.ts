import { parsePolicyRuleArrayDTO } from '@anarchitects/auth-ts/dtos';
import { Action, PolicyRule, Subject } from '@anarchitects/auth-ts/models';
import { createMongoAbility, MongoAbility, subject } from '@casl/ability';

type AbilitySubject = Subject | object;

type AbilityResource = Record<string, unknown>;

export type AppAbility = MongoAbility<[Action, AbilitySubject]>;

const toSafePolicyRules = (rules: PolicyRule[]): PolicyRule[] => {
  try {
    return parsePolicyRuleArrayDTO(rules, 'rbac');
  } catch {
    return [];
  }
};

const isAbilityResource = (value: unknown): value is AbilityResource =>
  !!value && typeof value === 'object' && !Array.isArray(value);

export const createAppAbility = (rules: PolicyRule[]): AppAbility =>
  createMongoAbility(toSafePolicyRules(rules)) as AppAbility;

export const asAppAbilitySubject = <TResource extends AbilityResource>(
  subjectName: Subject,
  resource: TResource,
): TResource & { __caslSubjectType__: Subject } =>
  subject(subjectName, resource) as TResource & { __caslSubjectType__: Subject };

export const canAccessResource = <TResource extends AbilityResource>(
  ability: AppAbility | undefined,
  action: Action,
  subjectName: Subject,
  resource: TResource,
): boolean => {
  if (!ability || !isAbilityResource(resource)) {
    return false;
  }

  try {
    return ability.can(action, asAppAbilitySubject(subjectName, resource));
  } catch {
    return false;
  }
};

export const canAccessResourceField = <TResource extends AbilityResource>(
  ability: AppAbility | undefined,
  action: Action,
  subjectName: Subject,
  field: string,
  resource: TResource,
): boolean => {
  if (!ability || !isAbilityResource(resource)) {
    return false;
  }

  try {
    return ability.can(
      action,
      asAppAbilitySubject(subjectName, resource),
      field,
    );
  } catch {
    return false;
  }
};
